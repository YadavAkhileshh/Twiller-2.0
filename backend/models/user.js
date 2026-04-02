import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  avatar: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now },
  language: { type: String, default: "en" },
  loginHistory: [{
    ip: String,
    browser: String,
    os: String,
    deviceType: String,
    timestamp: { type: Date, default: Date.now }
  }],
  subscription: {
    plan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
    expiresAt: { type: Date },
    tweetsThisMonth: { type: Number, default: 0 }
  },
  notificationSettings: {
    enabled: { type: Boolean, default: true }
  },
  lastPasswordReset: { type: Date },
  password: { type: String }
});

export default mongoose.model("User", UserSchema);