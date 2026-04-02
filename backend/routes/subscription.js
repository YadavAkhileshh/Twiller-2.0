import express from 'express';
import { checkPaymentWindow } from '../utils/timeChecks.js';
import User from '../models/user.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const planInfo = {
    free: { price: 0, tweets: 1 },
    bronze: { price: 100, tweets: 3 },
    silver: { price: 300, tweets: 5 },
    gold: { price: 1000, tweets: Infinity }
};

router.post('/subscribe', checkPaymentWindow, async (req, res) => {
    const { userId, planType, email } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "user not found" });

        if (!planInfo[planType]) {
            return res.status(400).json({ message: "invalid plan" });
        }

        const amountInPaise = planInfo[planType].price * 100;
        
        if (amountInPaise === 0) {

            user.subscription = {
                plan: planType,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                tweetsThisMonth: 0
            };
            await user.save();
            return res.status(200).json({ message: 'Subscribed to free plan!', subscription: user.subscription });
        }

        const options = {
            amount: amountInPaise,
            currency: "INR",
        };
        
        const order = await razorpay.orders.create(options);
        
        res.status(200).json({
            orderId: order.id,
            amount: order.amount
        });

    } catch (err) {
        console.log('subscription error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planType, email } = req.body;

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Invalid signature" });
        }

        const user = await User.findById(userId);
        if (user) {
            user.subscription = {
                plan: planType,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                tweetsThisMonth: 0
            };
            await user.save();
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const amountPaid = planInfo[planType].price;
        const today = new Date().toLocaleDateString();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Twiller Subscription Invoice',
            text: `Hi ${user ? user.username : 'User'},\n\nThanks for subscribing to the ${planType} plan.\n\nAmount paid: ${amountPaid}\nPayment ID: ${razorpay_payment_id}\nDate: ${today}\n\nYour plan is now active.\n\nTeam Twiller`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email error:', error);
            }
        });

        res.status(200).json({ message: "Verification successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
