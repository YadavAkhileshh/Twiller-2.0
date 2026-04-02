'use client';

import React, { useState, useEffect } from 'react';
import AudioTweetComposer from '@/components/features/AudioTweetComposer';
import ForgotPassword from '@/components/features/ForgotPassword';
import SubscriptionPlans from '@/components/features/SubscriptionPlans';
import LanguageSelector from '@/components/features/LanguageSelector';
import LoginHistoryView from '@/components/features/LoginHistory';
import NotificationToggle from '@/components/features/NotificationToggle';
import { getRequest } from '@/lib/api';

export default function TwillerTasksPage() {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const stored = localStorage.getItem('twitter-user');
            let userEmail = 'test@twiller.com';
            if (stored) {
                try {
                    userEmail = JSON.parse(stored).email;
                } catch(e) {
                    console.log('failed to parse stored user, using default');
                }
            }
            const data = await getRequest(`/loggedinuser?email=${userEmail}`);
            if (data) {
                setUserData(data);
            } else {
                setUserData({
                    _id: 'demo',
                    email: 'demo@twiller.com',
                    loginHistory: [
                        { ip: '192.168.1.1', browser: 'Chrome', os: 'Windows 11', deviceType: 'Desktop', timestamp: new Date().toISOString() },
                        { ip: '10.0.0.42', browser: 'Safari', os: 'iOS 17', deviceType: 'Mobile', timestamp: new Date(Date.now() - 3600000).toISOString() }
                    ]
                });
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    if (loading) return <div style={{ padding: '80px 20px', textAlign: 'center', color: '#888' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', padding: '20px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                <h1 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>Twiller Features</h1>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '30px' }}>All the features for the internship project</p>

                {userData?._id === 'demo' && (
                    <p style={{ color: '#e8a735', fontSize: '12px', marginBottom: '20px', background: '#1a1a00', padding: '10px', borderRadius: '6px' }}>
                        ⚠ Demo mode - run &quot;node backend/seedTestUser.js&quot; to set up test user
                    </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <AudioTweetComposer />
                    <NotificationToggle />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
                    <ForgotPassword />
                    <LoginHistoryView history={userData?.loginHistory || []} />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <LanguageSelector userId={userData?._id} />
                </div>

                <div style={{ marginBottom: '60px' }}>
                    <SubscriptionPlans userId={userData?._id} email={userData?.email} />
                </div>
            </div>
        </div>
    );
}
