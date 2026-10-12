import { MongoClient } from "mongodb";

// Local DB
const localUri = "mongodb://127.0.0.1:27017/moneyminder";

// Atlas DB
const atlasUri = "mongodb+srv://soumikamyaka_db_user:jlUOrWKChAAq83Wx@cluster0.xa2mp77.mongodb.net/moneyminder?retryWrites=true&w=majority";

async function migrate() {
  const localClient = new MongoClient(localUri);
  const atlasClient = new MongoClient(atlasUri);

  try {
    await localClient.connect();
    await atlasClient.connect();

    const localDb = localClient.db("moneyminder");
    const atlasDb = atlasClient.db("moneyminder");

    // List all collections in local DB
    const collections = await localDb.listCollections().toArray();

    for (let col of collections) {
      const collectionName = col.name;
      console.log(`Migrating collection: ${collectionName}`);

      const data = await localDb.collection(collectionName).find().toArray();

      if (data.length > 0) {
        await atlasDb.collection(collectionName).insertMany(data);
        console.log(`Inserted ${data.length} documents into ${collectionName} on Atlas`);
      }
    }

    console.log("Migration completed!");
  } catch (err) {
    console.error(err);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
