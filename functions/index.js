const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// --- Function 1: createDepositRequest (No changes) ---
exports.createDepositRequest = functions.https.onCall(async (data, context) => {
    const BOT_TOKEN = "7669964695:AAGnnooQd0FEvyIrwDqWHyvFM43JLiJszfA";
    const CHAT_ID = "7590915954";
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "You must be logged in."); }
    const userEmail = context.auth.token.email;
    const amount = data.amount;
    const currency = data.currency;
    if (!amount || amount < 40 || !currency) { return { success: false, error: "Invalid deposit amount or currency." }; }
    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(userEmail); // Using email as ID for this version
    const transactionId = `TX-${Date.now()}`;
    const newTransaction = { id: transactionId, date: new Date().toISOString().split('T')[0], description: `Pending Deposit - ${currency}`, amount: amount, status: "Pending" };
    try {
        await walletRef.update({ transactions: admin.firestore.FieldValue.arrayUnion(newTransaction) });
        const message = `🔔 *New Deposit Request* 🔔\n--------------------------------------\n*User:* ${userEmail}\n*Amount:* €${amount.toFixed(2)}\n*Currency:* ${currency}\n*Transaction ID:* \`${transactionId}\`\n--------------------------------------\nPlease verify the payment.`;
        const keyboard = { inline_keyboard: [[{ text: "✅ Confirm Payment", callback_data: `confirm_${transactionId}_${userEmail}_${amount}` }, { text: "❌ Decline", callback_data: `decline_${transactionId}_${userEmail}` }]] };
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(telegramUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown', reply_markup: keyboard }) });
        return { success: true, transactionId: transactionId };
    } catch (error) {
        console.error("Error creating deposit:", error);
        throw new functions.https.HttpsError("internal", "An error occurred.");
    }
});

// --- Function 2: updateTransaction (No changes) ---
exports.updateTransaction = functions.https.onRequest(async (req, res) => {
    // ... (This function remains the same as before)
});

// --- NEW Function 3: processCheckout ---
exports.processCheckout = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to check out.");
    }

    const userEmail = context.auth.token.email;
    const cart = data.cart;

    if (!cart || cart.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Your cart is empty.");
    }

    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(userEmail);
    
    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Your wallet does not exist.");
        }

        const currentBalance = walletDoc.data().balance;
        const totalCost = cart.reduce((sum, item) => sum + item.price, 0);

        // 1. Check if user has enough balance
        if (currentBalance < totalCost) {
            throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
        }

        // 2. Check if all items are still available
        for (const item of cart) {
            const cardRef = db.collection("cards").doc(item.docId);
            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists || cardDoc.data().status !== "available") {
                throw new functions.https.HttpsError("aborted", `Item ${item.name} is no longer available.`);
            }
        }

        // 3. All checks passed. Proceed with purchase.
        // Deduct balance and add purchase transaction to wallet
        const purchaseTransactionId = `TX-PURCHASE-${Date.now()}`;
        const purchaseTransaction = {
            id: purchaseTransactionId,
            date: new Date().toISOString().split('T')[0],
            description: `Purchase - Order ${purchaseTransactionId}`,
            amount: -totalCost,
            status: "Success"
        };
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-totalCost),
            transactions: admin.firestore.FieldValue.arrayUnion(purchaseTransaction)
        });

        // Mark cards as "sold"
        for (const item of cart) {
            const cardRef = db.collection("cards").doc(item.docId);
            transaction.update(cardRef, { status: "sold" });
        }

        // 4. Create a new order document
        const orderId = `ULT-${Date.now()}`;
        const orderRef = db.collection("orders").doc(orderId);
        transaction.set(orderRef, {
            userEmail: userEmail,
            orderId: orderId,
            date: new Date().toISOString().split('T')[0],
            total: totalCost,
            status: "Completed",
            items: cart
        });

        return { success: true, orderId: orderId };
    });
});
