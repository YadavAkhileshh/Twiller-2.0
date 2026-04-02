# Twiller 2.0

Twitter clone I built for my internship. Frontend is Next.js, backend is Node.js with Express and MongoDB.

## What it does

- Record audio and post it as a tweet. Needs email OTP first. Only works 2-7 PM IST. Max 5 min, 100MB.
- Forgot password. Enter email or phone, get a new password. Only works once a day. Password is random letters only.
- Subscription plans. Free, Bronze (100), Silver (300), Gold (1000). Payment through Razorpay, only works 10-11 AM IST. Invoice gets emailed.
- Switch between 6 languages. French needs email OTP, others need mobile OTP.
- Login history. Tracks browser, OS, device, IP. Chrome needs OTP, Edge skips auth, mobile only works 10 AM-1 PM IST.
- Notifications. Get browser alerts when someone tweets about cricket or science. Can turn on/off.

## How to run

Backend:
```
cd backend
npm install
cp .env.example 
# fill in your env values
npm start
```

Frontend:
```
cd twiller
npm install
cp .env.example
# fill in your env values
npm run dev
```

## Env variables

Check `backend/.env.example` and `twiller/.env.example` for what you need to fill in.
