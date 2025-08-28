const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// --- Function 1: createDepositRequest (No changes) ---
exports.createDepositRequest = functions.https.onCall(async (data, context) => {
    // This function remains the same
    const BOT_TOKEN = "7669964695:AAGnnooQd0FEvyIrwDqWHyvFM43JLiJszfA";
    const CHAT_ID = "7590915954";
    if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "You must be logged in."); }
    const userEmail = context.auth.token.email;
    const amount = data.amount;
    const currency = data.currency;
    if (!amount || amount < 40 || !currency) { return { success: false, error: "Invalid deposit amount or currency." }; }
    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(userEmail);
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
    // This function remains the same
});

// --- Function 3: processCheckout (No changes) ---
exports.processCheckout = functions.https.onCall(async (data, context) => {
    // This function remains the same
});

// --- NEW Function 4: processPreOrder ---
exports.processPreOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to pre-order.");
    }

    const userEmail = context.auth.token.email;
    const card = data.card; // The pre-order card item sent from the website

    if (!card || !card.price || !card.id) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid card data provided.");
    }

    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(userEmail);
    const preorderCardRef = db.collection("preorder_cards").doc(card.id);
    
    // Use a Firestore transaction for safety
    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const cardDoc = await transaction.get(preorderCardRef);

        if (!walletDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Your wallet does not exist.");
        }
        if (!cardDoc.exists || cardDoc.data().status !== "available") {
            throw new functions.https.HttpsError("aborted", "This item is no longer available for pre-order.");
        }

        const currentBalance = walletDoc.data().balance;
        
        // 1. Check if user has enough balance
        if (currentBalance < card.price) {
            throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
        }

        // 2. All checks passed. Deduct balance and add a transaction record
        const purchaseTransaction = {
            id: `TX-PREORDER-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `Pre-Order - ${card.brand} ${card.level}`,
            amount: -card.price,
            status: "Success"
        };
        transaction.update(walletRef, {
            balance: admin.firestore.FieldValue.increment(-card.price),
            transactions: admin.firestore.FieldValue.arrayUnion(purchaseTransaction)
        });

        // 3. Mark the pre-order card as "sold" so no one else can buy it
        transaction.update(preorderCardRef, { status: "sold" });

        // 4. Create a new order document with "Pre-Ordered" status
        const orderId = `ULT-PRE-${Date.now()}`;
        const orderRef = db.collection("orders").doc(orderId);
        transaction.set(orderRef, {
            userEmail: userEmail,
            orderId: orderId,
            date: new Date().toISOString().split('T')[0],
            total: card.price,
            status: "Pre-Ordered",
            items: [card] // Save the single pre-ordered item
        });

        return { success: true, orderId: orderId };
    });
});
