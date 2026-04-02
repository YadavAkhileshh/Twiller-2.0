import express from 'express';
import User from '../models/user.js';
import { checkMobileAccessWindow } from '../utils/timeChecks.js';

const router = express.Router();

function makeSafePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}
router.post('/login', async (req, res) => {
    const { email, username } = req.body;
    const ua = req.headers['user-agent'];
    const ip = req.ip || req.connection.remoteAddress;

    if (!checkMobileAccessWindow(ua)) {
        return res.status(403).json({ message: "Mobile access only available between 10 AM and 1 PM IST" });
    }

    const isChrome = /Chrome/.test(ua) && !/Edge|Edg/.test(ua);
    const isEdge = /Edge|Edg/.test(ua);
    const deviceType = /Mobile|Android|iPhone/.test(ua) ? 'Mobile' : 'Desktop';

    let os = 'Unknown';
    try {
        os = ua.match(/\(([^)]+)\)/)[1].split(';')[0]; 
    } catch(e) {

    }

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.loginHistory.push({
            ip,
            browser: isEdge ? 'Microsoft Edge' : (isChrome ? 'Google Chrome' : 'Other'),
            os,
            deviceType,
            timestamp: new Date()
        });
        await user.save();



        if (isChrome) {
            return res.status(200).json({
                status: 'OTP_REQUIRED',
                message: "OTP sent to your email for verification",
                user: { id: user._id, username: user.username }
            });
        }

        if (isEdge) {
            return res.status(200).json({
                status: 'SUCCESS',
                message: "Logged in via Edge - no auth needed",
                user
            });
        }


        res.status(200).json({ status: 'SUCCESS', user });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { emailOrPhone } = req.body;

    try {
        if (!emailOrPhone) {
            return res.status(400).json({ message: "enter your email or phone number" });
        }

        const user = await User.findOne({ 
            $or: [
                { email: emailOrPhone },
                { phoneNumber: emailOrPhone }
            ] 
        });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email/phone" });
        }


        const today = new Date();
        if (user.lastPasswordReset && user.lastPasswordReset.toDateString() === today.toDateString()) {
            return res.status(429).json({ message: "Warning: use only time" });
        }

        const newPass = makeSafePassword();

        user.password = newPass;
        user.lastPasswordReset = today;
        await user.save();



        res.status(200).json({
            message: "Password reset successful",
            suggestedPassword: newPass
        });

    } catch (error) {
        console.log('forgot password error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;
