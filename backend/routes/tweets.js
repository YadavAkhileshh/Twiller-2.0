import express from 'express';
import { checkAudioUploadWindow } from '../utils/timeChecks.js';
import { io } from '../index.js';

const router = express.Router();

const otpStore = new Map();

router.post('/audio/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "email required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, { otp, expires: Date.now() + 300000 });

    res.status(200).json({ message: "OTP sent to your email" });
});

router.post('/audio/post', checkAudioUploadWindow, async (req, res) => {
    const { email, otp, duration, size, text } = req.body;


    const saved = otpStore.get(email);
    if (!saved || saved.otp !== otp || saved.expires < Date.now()) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
    }


    if (duration > 300) {
        return res.status(400).json({ message: "Audio too long. Max 5 minutes allowed." });
    }
    if (size > 100 * 1024 * 1024) {
        return res.status(400).json({ message: "File too big. Max 100MB." });
    }


    let shouldNotify = false;
    if (text) {
        const lower = text.toLowerCase();
        shouldNotify = lower.includes('cricket') || lower.includes('science');
    }

    const tweet = {
        id: Date.now(),
        text: text || '',
        type: 'audio',
        triggerNotifications: shouldNotify
    };

    otpStore.delete(email);
    io.emit('new-tweet', tweet);

    res.status(201).json({ message: "Audio tweet posted!", tweet });
});

export default router;
