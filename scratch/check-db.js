import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "codiotic-technology";

if (!mongoUri) {
  console.error("MONGODB_URI is missing in environment.");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log("Connected to MongoDB:", dbName);
    const db = client.db(dbName);
    
    // Check collections
    const collections = ["users", "water_logs", "reminders", "achievements", "streaks", "counters"];
    for (const name of collections) {
      const col = db.collection(name);
      const docs = await col.find().toArray();
      console.log(`\n--- Collection: ${name} (${docs.length} docs) ---`);
      console.log(JSON.stringify(docs, null, 2));
    }
  } catch (err) {
    console.error("Failed to connect or query:", err);
  } finally {
    await client.close();
  }
}

run();
