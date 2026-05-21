const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;
const uri =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/mediqueue";
const localUri = "mongodb://127.0.0.1:27017/mediqueue";
const dbName = process.env.MONGODB_DB || "mediqueue";
const jwtSecret =
  process.env.JWT_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  "mediqueue-dev-secret";

app.use(
  cors({
    origin: [process.env.CLIENT_BASE_URL, "http://localhost:3000"].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());

function createMongoClient(connectionUri) {
  const options = {
    serverSelectionTimeoutMS: 5000,
  };

  if (connectionUri.startsWith("mongodb+srv://")) {
    options.serverApi = {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    };
  }

  return new MongoClient(connectionUri, options);
}

let client = createMongoClient(uri);
let databasePromise;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = client
      .connect()
      .then(async () => {
        await client.db("admin").command({ ping: 1 });
        console.log("Connected to MongoDB for MediQueue");
        return client.db(dbName);
      })
      .catch((error) => {
        if (uri !== localUri && process.env.NODE_ENV !== "production") {
          console.warn(
            `Primary MongoDB connection failed (${error.code || error.message}). Falling back to local MongoDB.`,
          );
          client = createMongoClient(localUri);
          return client
            .connect()
            .then(async () => {
              await client.db("admin").command({ ping: 1 });
              console.log("Connected to local MongoDB for MediQueue");
              return client.db(dbName);
            })
            .catch((fallbackError) => {
              databasePromise = null;
              throw fallbackError;
            });
        }

        databasePromise = null;
        throw error;
      });
  }

  return databasePromise;
}

async function getCollection(name) {
  const database = await getDatabase();
  return database.collection(name);
}

app.get("/", (req, res) => {
  res.send("MediQueue server is running");
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Unable to complete the request right now.",
  });
});

app.listen(port, () => {
  console.log(`MediQueue server listening on http://localhost:${port}`);
});
