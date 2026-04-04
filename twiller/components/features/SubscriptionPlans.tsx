'use client';

import React, { useState, useEffect } from 'react';
import { postRequest } from '@/lib/api';

const plans = [
    { id: 'free', name: 'Free', price: 0, tweetLimit: '1 tweet' },
    { id: 'bronze', name: 'Bronze', price: 100, tweetLimit: '3 tweets' },
    { id: 'silver', name: 'Silver', price: 300, tweetLimit: '5 tweets' },
    { id: 'gold', name: 'Gold', price: 1000, tweetLimit: 'Unlimited' },
];

export default function SubscriptionPlans({ userId, email }: { userId: string, email: string }) {
    const [paymentAllowed, setPaymentAllowed] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const now = new Date();
        const istHour = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).getUTCHours();
        setPaymentAllowed(istHour >= 10 && istHour < 11);

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
    }, []);

    const handleBuy = async (planId: string) => {
        const istHour = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).getUTCHours();
        if (istHour < 10 || istHour >= 11) {
            alert("payment is only available between 10 AM and 11 AM IST");
            return;
        }
        if (!userId || !email) {
            alert('You need to be logged in to subscribe');
            return;
        }

        const res = await postRequest('/api/sub/subscribe', { userId, planType: planId, email });
        if (res.error) {
            alert(res.message || 'Payment failed');
            return;
        } 
        
        if (res.orderId && res.amount) {
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: res.amount,
                currency: "INR",
                name: "Twiller",
                description: `Subscription to ${planId} plan`,
                order_id: res.orderId,
                handler: async function (response: any) {
                    const verifyRes = await postRequest('/api/sub/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        userId,
                        planType: planId,
                        email
                    });
                    
                    if (verifyRes.error) {
                        alert("payment verification failed");
                    } else {
                        alert("payment successful your plan is now active");
                    }
                },
                prefill: { email: email },
                theme: { color: "#1d9bf0" }
            };
            
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } else {
            alert('something went wrong with payment');
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0 }}>Subscription Plans</h3>
                    <p style={{ color: '#777', fontSize: '12px', margin: '4px 0 0' }}>Choose a plan for more tweets per day</p>
                </div>
                <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', background: paymentAllowed ? '#0a2a0a' : '#2a1a00', color: paymentAllowed ? '#4a4' : '#c90' }}>
                    {paymentAllowed ? '● Payment window open' : '○ Payments: 10-11 AM IST only'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {plans.map(plan => (
                    <div key={plan.id} style={{ border: '1px solid #333', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>{plan.name}</h4>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px' }}>
                            ₹{plan.price}<span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>/mo</span>
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '16px', flex: 1 }}>
                            {plan.tweetLimit} per day
                        </p>
                        <button
                            onClick={() => handleBuy(plan.id)}
                            style={{ width: '100%', padding: '8px', background: '#1d9bf0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {plan.price === 0 ? 'Current Plan' : 'Subscribe'}
                        </button>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '10px', color: '#555', marginTop: '14px', textAlign: 'center' }}>
                Invoice will be emailed after successful payment. Payment window: 10-11 AM IST.
            </p>
        </div>
    );
}
