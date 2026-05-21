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

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64url(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString("utf8");
}

function verifyJwt(token) {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) return null;

  const expected = base64url(
    crypto
      .createHmac("sha256", jwtSecret)
      .update(`${header}.${payload}`)
      .digest(),
  );

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const data = JSON.parse(decodeBase64url(payload));
  if (data.exp && Date.now() / 1000 > data.exp) return null;
  return data;
}

function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  const payload = verifyJwt(token);
  if (!payload?.sub) {
    return res.status(401).json({
      success: false,
      message: "Valid authorization token required",
    });
  }

  req.user = payload;
  next();
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

function serializeTutor(body, user) {
  return {
    tutorName: body.tutorName,
    photo: body.photo,
    subject: body.subject,
    availableDays: body.availableDays,
    availableTime: body.availableTime,
    hourlyFee: Number(body.hourlyFee) || 0,
    totalSlot: Number(body.totalSlot) || 0,
    sessionStartDate: body.sessionStartDate,
    institution: body.institution,
    experience: body.experience,
    location: body.location,
    teachingMode: body.teachingMode,
    createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
    userId: user.sub,
    userEmail: user.email,
    userName: user.name,
  };
}

app.get("/tutors", async (req, res) => {
  const tutorsCollection = await getCollection("tutors");
  const { search, startDate, endDate } = req.query;
  const filter = {};

  if (search) {
    filter.tutorName = { $regex: String(search), $options: "i" };
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const limit = Number.parseInt(req.query.limit, 10);
  let query = tutorsCollection.find(filter).sort({ createdAt: -1 });
  if (limit > 0) query = query.limit(limit);

  res.json(await query.toArray());
});

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
