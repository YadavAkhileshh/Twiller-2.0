# Twiller 2.0

Twiller 2.0 is a full-stack, production-ready Twitter clone built with a Next.js (React) front-end and a Node.js/Express/MongoDB backend. 

Designed with a heavy focus on seamless **Feature Integration**, all advanced functionalities operate entirely *inline* within the natural flow of the application structure without relying on disjointed or standalone pages. 

## Integrated Features

*   **🎙️ Native Audio Tweeting**: Users can record and post audio directly inside the main `TweetComposer`. Triggered via the mic icon, it executes inline OTP verification and enforces a strict 2 PM–7 PM IST upload window (max 5 mins/100MB) directly from the feed.
*   **🔒 Intelligent Password Reset**: Forgot your password? The reset flow occurs within the standard `AuthModal` context. It enforces a strict once-a-day generation protocol creating secure alphabetic-only passwords.
*   **💳 Inline Premium Subscriptions**: Hitting your daily tweet limit dynamically intercepts your tweet event to pull down Razorpay right below the composer. Subscriptions (Bronze, Silver, Gold) can only be purchased precisely during a specialized 10 AM-11 AM IST gateway window.
*   **🌐 In-Menu Localization**: Change platform languages to Hindi, Spanish, Chinese, Portuguese or French directly within the left-hand navigation sidebar. Switching to French triggers an inline multi-factor OTP sequence inside the menu itself.
*   **📊 Deep Profile Analytics**: Profiles have been expanded with tabular layouts allowing users to seamlessly switch to their "History" tab to review their specific login history—combining Browser, OS, IP, and Device type logic.
*   **🔔 Keyword Notifications**: Profiles feature a "Settings" tab that hosts an integrated web-push socket architecture. It seamlessly flags device notifications if recent feed activity revolves around designated tracked keywords (e.g., "cricket", "science").

## Technology Stack

*   **Frontend**: Next.js 14, React 18, Tailwind CSS, Shadcn UI overlays.
*   **Backend**: Node.js, Express, Firebase v10 Auth, Socket.io, Razorpay.
*   **Database**: MongoDB connected via Mongoose.

## Operating Instructions

### Backend:
```bash
cd backend
npm install
cp .env.example .env # Fill with your Mongo URI, Nodemailer creds, and Razorpay secrets
npm start
```

### Frontend:
```bash
cd twiller
npm install
cp .env.example .env.local # Fill with your Firebase keys and backend URL
npm run dev
```

Visit `http://localhost:3000` to start exploring the platform.
