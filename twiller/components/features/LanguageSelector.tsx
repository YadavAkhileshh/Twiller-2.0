'use client';

import React, { useState } from 'react';
import { postRequest } from '@/lib/api';

const langOptions = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Spanish' },
    { id: 'hi', label: 'Hindi' },
    { id: 'pt', label: 'Portuguese' },
    { id: 'zh', label: 'Chinese' },
    { id: 'french', label: 'French' },
];

export default function LanguageSelector({ userId }: { userId: string }) {
    const [view, setView] = useState('list');
    const [selectedLang, setSelectedLang] = useState<any>(null);
    const [otp, setOtp] = useState('');
    const [verifyMethod, setVerifyMethod] = useState('');

    const chooseLang = async (lang: any) => {
        if (!userId) {
            alert('you need to be logged in');
            return;
        }
        setSelectedLang(lang);
        
        const res = await postRequest('/api/lang/request-otp', { userId, targetLang: lang.id });
        if (res.error) {
            alert(res.message || 'Failed to request OTP');
            setSelectedLang(null);
        } else if (res.method) {
            setVerifyMethod(res.method);
            setView('verify');
        } else {
            alert(res.message || 'something went wrong');
        }
    };

    const verifyOtp = async () => {
        const res = await postRequest('/api/lang/verify-and-switch', { userId, otp });
        if (res.error) {
            alert(res.message || 'OTP verification failed');
        } else if (res.language) {
            alert('Language changed to ' + selectedLang.label + '!');
            setView('list');
            setOtp('');
        } else {
            alert(res.message || 'error verifying');
        }
    };

    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px' }}>🌐 Language</h3>

            {view === 'list' ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {langOptions.map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => chooseLang(lang)}
                            style={{ padding: '8px 16px', border: '1px solid #333', borderRadius: '6px', background: 'transparent', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            ) : (
                <div style={{ maxWidth: '300px' }}>
                    <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px' }}>
                        Switching to <b>{selectedLang?.label}</b> — enter OTP sent via {verifyMethod.toLowerCase()}
                    </p>
                    <input
                        type="text"
                        placeholder="enter OTP"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '14px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={verifyOtp} style={{ flex: 1, padding: '8px', background: '#1d9bf0', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Verify
                        </button>
                        <button onClick={() => { setView('list'); setOtp(''); }} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
