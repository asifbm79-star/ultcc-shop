const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const preorderCollection = db.collection("preorder_cards");

async function uploadPreorderData() {
    try {
        console.log("Reading data from preorder_data.json...");
        const dataBuffer = fs.readFileSync("./preorder_data.json");
        const cards = JSON.parse(dataBuffer.toString());

        if (!cards || cards.length === 0) {
            console.error("Error: preorder_data.json is empty.");
            return;
        }

        console.log(`Found ${cards.length} pre-order cards to upload.`);
        const batch = db.batch();
        cards.forEach(card => {
            const docRef = preorderCollection.doc();
            batch.set(docRef, card);
        });

        await batch.commit();
        console.log("✅ Success! All pre-order cards have been uploaded.");

    } catch (error) {
        console.error("❌ Error uploading data:", error);
    }
}

uploadPreorderData();
