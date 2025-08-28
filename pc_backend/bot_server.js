// This script runs on your PC and acts as your backend server.

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = "7669964695:AAGnnooQd0FEvyIrwDqWHyvFM43JLiJszfA";
const YOUR_CHAT_ID = "7590915954"; // Your personal Telegram Chat ID

// --- Initialization ---
const admin = require("firebase-admin");
const TelegramBot = require("node-telegram-bot-api");

// Initialize Firebase Admin with your service account key
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log("✅ Backend server started. Listening for database changes...");

// --- Main Logic: Listen for Wallet Updates ---
db.collection("wallets").onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
        // We only care about when a document is MODIFIED
        if (change.type === "modified") {
            const walletData = change.doc.data();
            const userEmail = change.doc.id;

            // Find the newest transaction
            const latestTransaction = walletData.transactions[walletData.transactions.length - 1];

            // If the newest transaction is "Pending", send a notification
            if (latestTransaction && latestTransaction.status === "Pending") {
                console.log(`New pending deposit detected for ${userEmail}. Sending notification...`);
                sendDepositNotification(userEmail, latestTransaction);
            }
        }
    });
});

// --- Function to Send Telegram Notification ---
function sendDepositNotification(userEmail, transaction) {
    const message = `
🔔 *New Deposit Request* 🔔
--------------------------------------
*User:* ${userEmail}
*Amount:* €${transaction.amount.toFixed(2)}
*Transaction ID:* \`${transaction.id}\`
--------------------------------------
Please verify the payment.
    `;

    const options = {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [[
                { text: "✅ Confirm Payment", callback_data: `confirm_${transaction.id}_${userEmail}_${transaction.amount}` },
                { text: "❌ Decline", callback_data: `decline_${transaction.id}_${userEmail}` }
            ]]
        }
    };

    bot.sendMessage(YOUR_CHAT_ID, message, options);
}

// --- Logic to Handle Button Presses on Telegram ---
bot.on("callback_query", async (callbackQuery) => {
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
            transactions[txIndex].status = "Success";
            await walletRef.update({
                transactions: transactions,
                balance: admin.firestore.FieldValue.increment(amount)
            });
            messageText = `✅ Payment for ${transactionId} confirmed. €${amount.toFixed(2)} added to ${userEmail}.`;
        } else if (action === "decline") {
            transactions[txIndex].status = "Failed";
            await walletRef.update({ transactions: transactions });
            messageText = `❌ Payment for ${transactionId} was declined.`;
        }

        bot.sendMessage(callbackQuery.message.chat.id, messageText);
        console.log(`Processed action: ${action} for transaction ${transactionId}`);

    } catch (error) {
        console.error("Error updating transaction:", error);
        bot.sendMessage(callbackQuery.message.chat.id, "An error occurred while updating the transaction.");
    }
});