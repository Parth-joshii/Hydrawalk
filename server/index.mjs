import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config({ override: true });

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 4173);
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "codiotic-technology";
const JWT_SECRET = process.env.JWT_SECRET || "hydrawalk_gemini_jwt_super_secret_key_2026";

if (!mongoUri) {
  throw new Error("MONGODB_URI is required. Add it to .env before starting the API.");
}

const client = new MongoClient(mongoUri);
let db;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

async function connectDb() {
  if (db) return db;

  await client.connect();
  db = client.db(dbName);

  try {
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("water_logs").createIndex({ userId: 1, timestamp: -1 }),
      db.collection("reminders").createIndex({ userId: 1, time: -1 }),
      db.collection("achievements").createIndex({ userId: 1, id: 1 }, { unique: true }),
    ]);
  } catch (err) {
    console.warn("Index creation warning (may already exist with different params):", err.message);
  }

  return db;
}

function collections() {
  return {
    users: db.collection("users"),
    waterLogs: db.collection("water_logs"),
    reminders: db.collection("reminders"),
    achievements: db.collection("achievements"),
    streaks: db.collection("streaks"),
  };
}

function withoutMongoId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return fallback;
}

function normalizeProfile(input) {
  if (!input) return null;

  return {
    ...withoutMongoId(input),
    id: input._id ? input._id.toString() : "1",
    age: Number(input.age || 20),
    weight: Number(input.weight || 60),
    daily_goal: Number(input.daily_goal || 2500),
    reminder_interval: Number(input.reminder_interval || 60),
    sound_enabled: normalizeBoolean(input.sound_enabled, true),
    sound_volume: Number(input.sound_volume ?? 0.5),
    startup_enabled: normalizeBoolean(input.startup_enabled, true),
    overlay_enabled: normalizeBoolean(input.overlay_enabled, true),
    theme: input.theme === "light" ? "light" : "dark",
    animations_enabled: normalizeBoolean(input.animations_enabled, true),
    character_outfit: input.character_outfit || "hoodie_blue",
    language: input.language || "en",
    member_since: input.member_since || new Date().toISOString(),
  };
}

function normalizeStreak(input) {
  return {
    current_streak: Number(input?.current_streak ?? 0),
    longest_streak: Number(input?.longest_streak ?? 0),
    last_drink_date: input?.last_drink_date ?? null,
  };
}

async function ensureStreak(userId) {
  await db.collection("streaks").updateOne(
    { _id: userId },
    {
      $setOnInsert: {
        current_streak: 0,
        longest_streak: 0,
        last_drink_date: null,
      },
    },
    { upsert: true },
  );
}

async function updateDrinkStreak(userId) {
  await ensureStreak(userId);
  const { streaks } = collections();
  const streak = normalizeStreak(await streaks.findOne({ _id: userId }));
  const today = todayPrefix();

  if (streak.last_drink_date === today) return;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  const currentStreak = streak.last_drink_date === yesterday
    ? streak.current_streak + 1
    : 1;

  await streaks.updateOne(
    { _id: userId },
    {
      $set: {
        current_streak: currentStreak,
        longest_streak: Math.max(currentStreak, streak.longest_streak),
        last_drink_date: today,
      },
    },
    { upsert: true },
  );
}

function todayPrefix() {
  return new Date().toISOString().split("T")[0];
}

function rangeCutoff(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days || 30));
  return cutoff.toISOString();
}

// Authorization Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Sign in first." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid session token. Please log in again." });
  }
}

// Global DB Connector
app.use(async (_req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(503).json({
      error: "MongoDB connection failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// Authentication Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required fields." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const existing = await collections().users.findOne({ email: emailClean });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await collections().users.insertOne({
      email: emailClean,
      password: hashedPassword,
      name: String(name).trim(),
      theme: "dark",
      daily_goal: 2500,
      reminder_interval: 60,
      sound_enabled: true,
      sound_volume: 0.5,
      startup_enabled: false,
      overlay_enabled: true,
      animations_enabled: true,
      character_outfit: "hoodie_blue",
      language: "en",
      member_since: new Date().toISOString(),
    });

    const userId = result.insertedId.toString();
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, user: { id: userId, name, email: emailClean } });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Could not complete registration. Try again." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const user = await collections().users.findOne({ email: emailClean });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const userId = user._id.toString();
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Could not log in. Try again." });
  }
});

// Scoped Profile Routes
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, database: dbName });
});

app.get("/api/profile", authMiddleware, async (req, res) => {
  const user = await collections().users.findOne({ _id: new ObjectId(req.userId) });
  res.json({ user: normalizeProfile(user) });
});

app.put("/api/profile", authMiddleware, async (req, res) => {
  const profile = normalizeProfile({
    ...req.body,
  });

  // Prevent overriding credentials
  delete profile._id;
  delete profile.id;
  delete profile.password;
  delete profile.email;

  await collections().users.updateOne(
    { _id: new ObjectId(req.userId) },
    { $set: profile },
    { upsert: true }
  );

  res.json({ user: { ...profile, id: req.userId } });
});

// Scoped Water Intake Routes
app.post("/api/water", authMiddleware, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: "A positive water amount is required." });
    return;
  }

  const log = {
    amount,
    timestamp: new Date().toISOString(),
    userId: req.userId,
  };

  await collections().waterLogs.insertOne(log);
  await updateDrinkStreak(req.userId);
  res.json({ log: { ...log, id: log._id.toString() } });
});

app.get("/api/water/today", authMiddleware, async (req, res) => {
  const logs = await collections().waterLogs
    .find({ userId: req.userId, timestamp: { $regex: `^${todayPrefix()}` } })
    .sort({ timestamp: -1 })
    .toArray();
  const total = logs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
  const normalizedLogs = logs.map((l) => ({ ...withoutMongoId(l), id: l._id.toString() }));
  res.json({ logs: normalizedLogs, total });
});

app.get("/api/water/range", authMiddleware, async (req, res) => {
  const logs = await collections().waterLogs
    .find({ userId: req.userId, timestamp: { $gte: rangeCutoff(req.query.days) } })
    .sort({ timestamp: 1 })
    .toArray();
  const normalizedLogs = logs.map((l) => ({ ...withoutMongoId(l), id: l._id.toString() }));
  res.json({ logs: normalizedLogs });
});

app.get("/api/water/count", authMiddleware, async (req, res) => {
  const count = await collections().waterLogs.countDocuments({ userId: req.userId });
  res.json({ count });
});

app.get("/api/water/latest", authMiddleware, async (req, res) => {
  const log = await collections().waterLogs
    .find({ userId: req.userId })
    .sort({ timestamp: -1 })
    .limit(1)
    .next();
  res.json({ log: log ? { ...withoutMongoId(log), id: log._id.toString() } : null });
});

// Scoped Reminder Routes
app.post("/api/reminders", authMiddleware, async (req, res) => {
  const reminder = {
    time: new Date().toISOString(),
    status: req.body?.status,
    water_amount: Number(req.body?.water_amount || 0),
    response_time: Number(req.body?.response_time || 0),
    userId: req.userId,
  };

  if (!["Completed", "Overdue", "Skipped", "Snoozed"].includes(reminder.status)) {
    res.status(400).json({ error: "Invalid reminder status." });
    return;
  }

  await collections().reminders.insertOne(reminder);
  res.json({ reminder: { ...reminder, id: reminder._id.toString() } });
});

app.get("/api/reminders/range", authMiddleware, async (req, res) => {
  const reminders = await collections().reminders
    .find({ userId: req.userId, time: { $gte: rangeCutoff(req.query.days) } })
    .sort({ time: 1 })
    .toArray();
  const normalizedReminders = reminders.map((r) => ({ ...withoutMongoId(r), id: r._id.toString() }));
  res.json({ reminders: normalizedReminders });
});

app.get("/api/reminders/today", authMiddleware, async (req, res) => {
  const reminders = await collections().reminders
    .find({ userId: req.userId, time: { $regex: `^${todayPrefix()}` } })
    .sort({ time: 1 })
    .toArray();
  const normalizedReminders = reminders.map((r) => ({ ...withoutMongoId(r), id: r._id.toString() }));
  res.json({ reminders: normalizedReminders });
});

// Scoped Streak Route
app.get("/api/streak", authMiddleware, async (req, res) => {
  await ensureStreak(req.userId);
  const streak = await collections().streaks.findOne({ _id: req.userId });
  res.json({ streak: normalizeStreak(streak) });
});

// Scoped Achievement Routes
app.get("/api/achievements", authMiddleware, async (req, res) => {
  const achievements = await collections().achievements
    .find({ userId: req.userId })
    .sort({ unlocked_at: 1 })
    .toArray();
  res.json({ achievements: achievements.map((achievement) => achievement.id) });
});

app.post("/api/achievements/:id/unlock", authMiddleware, async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Achievement id is required." });
  }

  const result = await collections().achievements.updateOne(
    { id, userId: req.userId },
    { $setOnInsert: { id, userId: req.userId, unlocked_at: new Date().toISOString() } },
    { upsert: true }
  );

  res.json({ unlocked: result.upsertedCount > 0 });
});

// Scoped Data Deletion & Backup
app.delete("/api/data", authMiddleware, async (req, res) => {
  const { waterLogs, reminders, achievements, streaks } = collections();
  await Promise.all([
    waterLogs.deleteMany({ userId: req.userId }),
    reminders.deleteMany({ userId: req.userId }),
    achievements.deleteMany({ userId: req.userId }),
    streaks.updateOne(
      { _id: req.userId },
      {
        $set: {
          current_streak: 0,
          longest_streak: 0,
          last_drink_date: null,
        },
      },
      { upsert: true }
    ),
  ]);

  res.json({ ok: true });
});

app.get("/api/backup", authMiddleware, async (req, res) => {
  const { users, waterLogs, reminders, achievements, streaks } = collections();
  const [profileDoc, waterLogDocs, reminderDocs, achievementDocs, streakDoc] = await Promise.all([
    users.findOne({ _id: new ObjectId(req.userId) }),
    waterLogs.find({ userId: req.userId }).sort({ timestamp: 1 }).toArray(),
    reminders.find({ userId: req.userId }).sort({ time: 1 }).toArray(),
    achievements.find({ userId: req.userId }).sort({ unlocked_at: 1 }).toArray(),
    streaks.findOne({ _id: req.userId }),
  ]);

  res.json({
    users: profileDoc ? [normalizeProfile(profileDoc)] : [],
    waterLogs: waterLogDocs.map((l) => ({ ...withoutMongoId(l), id: l._id.toString() })),
    reminders: reminderDocs.map((r) => ({ ...withoutMongoId(r), id: r._id.toString() })),
    achievements: achievementDocs.map((a) => ({ ...withoutMongoId(a), id: a._id.toString() })),
    streaks: streakDoc ? [normalizeStreak(streakDoc)] : [],
    exported_at: new Date().toISOString(),
    version: "2.0",
  });
});

app.post("/api/backup", authMiddleware, async (req, res) => {
  const data = req.body;
  const { waterLogs, reminders, achievements, streaks } = collections();

  await Promise.all([
    waterLogs.deleteMany({ userId: req.userId }),
    reminders.deleteMany({ userId: req.userId }),
    achievements.deleteMany({ userId: req.userId }),
    streaks.deleteMany({ _id: req.userId }),
  ]);

  const importedWaterLogs = Array.isArray(data.waterLogs)
    ? data.waterLogs.map((l) => ({ ...withoutMongoId(l), userId: req.userId }))
    : [];
  const importedReminders = Array.isArray(data.reminders)
    ? data.reminders.map((r) => ({ ...withoutMongoId(r), userId: req.userId }))
    : [];
  const importedAchievements = Array.isArray(data.achievements)
    ? data.achievements.map((a) => ({ ...withoutMongoId(a), userId: req.userId }))
    : [];
  const importedStreaks = Array.isArray(data.streaks) && data.streaks.length > 0
    ? data.streaks.map(normalizeStreak)
    : [normalizeStreak(null)];

  if (importedWaterLogs.length > 0) await waterLogs.insertMany(importedWaterLogs);
  if (importedReminders.length > 0) await reminders.insertMany(importedReminders);
  if (importedAchievements.length > 0) await achievements.insertMany(importedAchievements);
  await streaks.insertOne({ _id: req.userId, ...importedStreaks[0] });

  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.listen(port, () => {
  console.log(`HydraWalk Mongo API running on http://localhost:${port}`);
});

setInterval(() => {
  console.log("API Server Heartbeat: Active");
}, 2000);
