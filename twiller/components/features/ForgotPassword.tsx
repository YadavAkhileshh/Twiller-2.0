'use client';

import React, { useState } from 'react';
import { postRequest } from '@/lib/api';

export default function ForgotPassword() {
    const [inputVal, setInputVal] = useState('');
    const [result, setResult] = useState<'none' | 'ok' | 'fail'>('none');
    const [newPwd, setNewPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');

    const handleReset = async () => {
        if (!inputVal) {
            setResult('fail');
            setErrMsg('Please type your email or phone number');
            return;
        }
        setResult('none');
        setErrMsg('');

        const res = await postRequest('/api/auth/forgot-password', { emailOrPhone: inputVal });

        if (res.error) {
            setResult('fail');
            setErrMsg(res.message || 'Something went wrong. Try again.');
        } else if (res.suggestedPassword) {
            setResult('ok');
            setNewPwd(res.suggestedPassword);
        } else {
            setResult('fail');
            setErrMsg('Unexpected error');
        }
    };

    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '14px' }}>🔑 Reset Password</h3>

            <input
                type="text"
                placeholder="email or phone number"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }}
            />

            {result === 'fail' && (
                <p style={{ color: '#e55', fontSize: '12px', marginBottom: '8px', padding: '6px 8px', background: '#1a0000', borderRadius: '4px' }}>
                    {errMsg}
                </p>
            )}

            {result === 'ok' ? (
                <div style={{ background: '#0a1a0a', padding: '14px', borderRadius: '6px', border: '1px solid #1a3a1a' }}>
                    <p style={{ color: '#4a4', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Password reset done!</p>
                    <div style={{ textAlign: 'center', background: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                        <span style={{ color: '#888', fontSize: '10px', display: 'block', marginBottom: '4px' }}>YOUR NEW PASSWORD</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '18px', color: '#1d9bf0', letterSpacing: '1px' }}>{newPwd}</span>
                    </div>
                    <p style={{ color: '#666', fontSize: '10px', marginTop: '6px' }}>Copy this password and save it somewhere safe</p>
                </div>
            ) : (
                <button
                    onClick={handleReset}
                    style={{ width: '100%', padding: '10px', background: '#fff', color: '#000', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Generate New Password
                </button>
            )}
        </div>
    );
}
