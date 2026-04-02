import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import authRoutes from "./routes/auth.js";
import tweetRoutes from "./routes/tweets.js";
import subRoutes from "./routes/subscription.js";
import langRoutes from "./routes/language.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
export const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);
app.use("/api/sub", subRoutes);
app.use("/api/lang", langRoutes);

app.get("/", (req, res) => {
  res.send("Twiller backend running");
});

const port = process.env.PORT || 5000;
const url = process.env.MONOGDB_URL;

mongoose
  .connect(url)
  .then(() => {
    console.log("connected to mongodb");
    server.listen(port, () => {
      console.log("server running on port " + port);
    });
  })
  .catch((err) => {
    console.log("mongodb connection failed:", err.message);
  });

app.post("/register", async (req, res) => {
  try {
    const existinguser = await User.findOne({ email: req.body.email });
    if (existinguser) {
      return res.status(200).send(existinguser);
    }
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(201).send(newUser);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});


app.get("/loggedinuser", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ error: "email is required" });
    }
    const user = await User.findOne({ email: email });
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});


app.patch("/userupdate/:email", async (req, res) => {
  try {
    const filter = { email: req.params.email };
    const updated = await User.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, upsert: false }
    );
    return res.status(200).send(updated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/post", async (req, res) => {
  try {
    const tweet = new Tweet(req.body);
    await tweet.save();
    return res.status(201).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});


app.get("/post", async (req, res) => {
  try {
    const tweets = await Tweet.find().sort({ timestamp: -1 }).populate("author");
    return res.status(200).send(tweets);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});


app.post("/like/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.likedBy.includes(userId)) {
      tweet.likes += 1;
      tweet.likedBy.push(userId);
      await tweet.save();
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});


app.post("/retweet/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.retweetedBy.includes(userId)) {
      tweet.retweets += 1;
      tweet.retweetedBy.push(userId);
      await tweet.save();
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});