// This is your complete backend server code.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Initialize the Firebase Admin SDK, which gives the server access to your database
admin.initializeApp();

// --- Function 1: createDepositRequest ---
// This is triggered by your website when a user clicks "Create" on the deposit modal.
exports.createDepositRequest = functions.https.onCall(async (data, context) => {
    // --- Configuration ---
    // PASTE YOUR TELEGRAM BOT TOKEN AND CHAT ID HERE
    const BOT_TOKEN = "7669964695:AAGnnooQd0FEvyIrwDqWHyvFM43JLiJszfA";
    const CHAT_ID = "7590915954";

    // 1. Check if the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a deposit.");
    }

    // 2. Get data from the frontend
    const userEmail = context.auth.token.email;
    const amount = data.amount;
    const currency = data.currency;

    if (!amount || amount < 40 || !currency) {
        return { success: false, error: "Invalid deposit amount or currency." };
    }

    // 3. Create a new transaction in the Firestore database
    const db = admin.firestore();
    const walletRef = db.collection("wallets").doc(userEmail);
    const transactionId = `TX-${Date.now()}`;

    const newTransaction = {
        id: transactionId,
        date: new Date().toISOString().split('T')[0], // Get date in YYYY-MM-DD format
        description: `Pending Deposit - ${currency}`,
        amount: amount,
        status: "Pending" // Set the initial status
    };

    try {
        // Add the new transaction to the user's transaction array in the database
        await walletRef.update({
            transactions: admin.firestore.FieldValue.arrayUnion(newTransaction)
        });

        // 4. Prepare and send the Telegram notification with buttons
        const message = `
🔔 *New Deposit Request* 🔔
--------------------------------------
*User:* ${userEmail}
*Amount:* €${amount.toFixed(2)}
*Currency:* ${currency}
*Transaction ID:* \`${transactionId}\`
--------------------------------------
Please verify the payment.
        `;

        // Create inline keyboard buttons for Telegram
        const keyboard = {
            inline_keyboard: [[
                { text: "✅ Confirm Payment", callback_data: `confirm_${transactionId}_${userEmail}_${amount}` },
                { text: "❌ Decline", callback_data: `decline_${transactionId}_${userEmail}` }
            ]]
        };

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                reply_markup: keyboard // Add the buttons to the message
            })
        });

        // 5. Send a success response back to the website
        return { success: true, transactionId: transactionId };

    } catch (error) {
        console.error("Error creating deposit:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while creating the deposit.");
    }
});


// --- Function 2: updateTransaction ---
// This is a webhook triggered when you tap a button on your Telegram bot.
exports.updateTransaction = functions.https.onRequest(async (req, res) => {
    const BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN";
    const db = admin.firestore();

    // Get the data from the Telegram button press
    const callbackQuery = req.body.callback_query;
    if (!callbackQuery) {
        return res.status(200).send("OK"); // Acknowledge the request from Telegram
    }

    const [action, transactionId, userEmail, amountStr] = callbackQuery.data.split('_');
    const amount = parseFloat(amountStr);
    const walletRef = db.collection("wallets").doc(userEmail);

    try {
        const walletDoc = await walletRef.get();
        if (!walletDoc.exists) throw new Error("Wallet not found");

        let transactions = walletDoc.data().transactions;
        const txIndex = transactions.findIndex(tx => tx.id === transactionId);
        if (txIndex === -1) throw new Error("Transaction not found");

        let messageText = "";

        if (action === "confirm") {
            // Update transaction status and add balance
            transactions[txIndex].status = "Success";
            transactions[txIndex].description = `Deposit via ${transactions[txIndex].description.split(' - ')[1]}`;
            
            await walletRef.update({
                transactions: transactions,
                balance: admin.firestore.FieldValue.increment(amount)
            });
            messageText = `✅ Payment for ${transactionId} confirmed. €${amount.toFixed(2)} added to ${userEmail}.`;

        } else if (action === "decline") {
            // Update transaction status to Failed
            transactions[txIndex].status = "Failed";
            await walletRef.update({ transactions: transactions });
            messageText = `❌ Payment for ${transactionId} was declined.`;
        }

        // Send a confirmation message back to the Telegram chat
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: callbackQuery.message.chat.id, text: messageText })
        });

        return res.status(200).send("OK");

    } catch (error) {
        console.error("Error updating transaction:", error);
        return res.status(500).send("Error");
    }
});
