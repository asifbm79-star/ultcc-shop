// This is a one-time use script to upload your card data to Firestore.

const admin = require("firebase-admin");
const fs = require("fs"); // Node.js file system module

// --- Initialization ---
// It uses the same service account key as your bot server.
const serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const cardsCollection = db.collection("cards");

// --- Main Upload Function ---
async function uploadData() {
    try {
        console.log("Reading data from card_data.json...");
        // Read the local JSON file
        const dataBuffer = fs.readFileSync("./card_data.json");
        const cards = JSON.parse(dataBuffer.toString());

        if (!cards || cards.length === 0) {
            console.error("Error: card_data.json is empty or not a valid array.");
            return;
        }

        console.log(`Found ${cards.length} cards to upload.`);
        console.log("Starting upload to Firestore. This may take a moment...");

        // Use a batch write for efficiency
        const batch = db.batch();
        cards.forEach(card => {
            const docRef = cardsCollection.doc(); // Create a new document with an auto-generated ID
            batch.set(docRef, card);
        });

        await batch.commit();

        console.log("✅ Success! All cards have been uploaded to your Firestore 'cards' collection.");

    } catch (error) {
        console.error("❌ Error uploading data:", error);
    }
}

// --- Run the script ---
uploadData();
