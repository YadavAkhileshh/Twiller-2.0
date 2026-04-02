import express from 'express';
import User from '../models/user.js';

const router = express.Router();

const pendingOtps = new Map();

router.post('/request-otp', async (req, res) => {
    const { userId, targetLang } = req.body;

    try {
        if (!userId) return res.status(400).json({ message: "userId is required" });
        if (!targetLang) return res.status(400).json({ message: "targetLang is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "user not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        const method = targetLang === 'french' ? 'EMAIL' : 'MOBILE';
        const contactInfo = method === 'EMAIL' ? user.email : user.phoneNumber;

        if (!contactInfo) {
            if (method === 'EMAIL') {
                return res.status(400).json({ message: "no email found in your profile" });
            } else {
                return res.status(400).json({ message: "no phone number found. add phone in profile settings first" });
            }
        }

        pendingOtps.set(userId.toString(), { otp, targetLang, expires: Date.now() + 300000 });

        res.status(200).json({
            message: 'OTP sent via ' + method.toLowerCase(),
            method
        });

    } catch (error) {
        console.log('lang otp error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

router.post('/verify-and-switch', async (req, res) => {
    const { userId, otp } = req.body;

    try {
        if (!userId) return res.status(400).json({ message: "userId required" });
        if (!otp) return res.status(400).json({ message: "enter the OTP" });

        const session = pendingOtps.get(userId.toString());
        
        if (!session) {
            return res.status(401).json({ message: "no OTP found - request a new one" });
        }
        if (session.otp !== otp) {
            return res.status(401).json({ message: "wrong OTP" });
        }
        if (session.expires < Date.now()) {
            pendingOtps.delete(userId.toString());
            return res.status(401).json({ message: "OTP expired, request again" });
        }

        const user = await User.findById(userId);
        if (!user) {
            pendingOtps.delete(userId.toString());
            return res.status(404).json({ message: "user not found" });
        }

        user.language = session.targetLang;
        await user.save();
        pendingOtps.delete(userId.toString());



        res.status(200).json({
            message: 'Language switched to ' + session.targetLang,
            language: user.language
        });

    } catch (error) {
        console.log('lang verify error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
