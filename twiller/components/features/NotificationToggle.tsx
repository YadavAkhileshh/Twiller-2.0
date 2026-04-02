'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function NotificationToggle() {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setEnabled(Notification.permission === 'granted');
        }
    }, []);

    useEffect(() => {
        let socket: Socket | null = null;
        if (enabled && typeof window !== 'undefined') {
            const url = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            socket = io(url);
            
            socket.on('new-tweet', (tweet: any) => {
                if (tweet && tweet.text) {
                    const textLower = tweet.text.toLowerCase();
                    if (textLower.includes('cricket') || textLower.includes('science')) {
                        if (Notification.permission === 'granted') {
                            new Notification("New Tweet Alert", { body: tweet.text });
                        }
                    }
                }
            });
        }
        
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [enabled]);

    const toggleNotif = async () => {
        if (!enabled) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                setEnabled(true);
                new Notification("Twiller Notifications", { body: "You'll get alerts for tweets about Cricket and Science" });
            } else {
                alert("Notification permission denied. You can enable it from browser settings.");
            }
        } else {
            setEnabled(false);
            alert("Notifications turned off");
        }
    };

    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px' }}>🔔 Notifications</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#ccc' }}>
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={toggleNotif}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    {enabled ? 'Notifications are ON' : 'Notifications are OFF'}
                </label>
            </div>

            <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '4px', border: '1px solid #222' }}>
                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                    You will get notified when a tweet contains: <b style={{ color: '#1d9bf0' }}>cricket</b> or <b style={{ color: '#1d9bf0' }}>science</b>
                </p>
            </div>
        </div>
    );
}
