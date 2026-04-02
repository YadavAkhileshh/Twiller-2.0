import mongoose from "mongoose";
const TweetSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'audio'], default: 'text' },
  audioUrl: { type: String },
  audioDuration: { type: Number },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  retweets: { type: Number, default: 0 },
  retweetedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Tweet", TweetSchema);