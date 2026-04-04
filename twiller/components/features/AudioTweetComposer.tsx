'use client';

import React, { useState, useRef, useEffect } from 'react';
import { postRequest } from '@/lib/api';

export default function AudioTweetComposer({ onPostSuccess }: { onPostSuccess?: () => void }) {
    const [currentStep, setCurrentStep] = useState('auth');
    const [userEmail, setUserEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [seconds, setSeconds] = useState(0);
    const [timeBlocked, setTimeBlocked] = useState(false);
    const [mounted, setMounted] = useState(false);

    const timer = useRef<any>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);

    useEffect(() => {
        setMounted(true);
        const now = new Date();
        const istHour = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).getUTCHours();
        const allowed = istHour >= 14 && istHour < 19;
        setTimeBlocked(!allowed);
    }, []);

    const sendOtp = async () => {
        if (!userEmail || !userEmail.includes('@')) {
            alert('enter a valid email first');
            return;
        }
        const res = await postRequest('/api/tweets/audio/request-otp', { email: userEmail });
        if (res.error) {
            alert(res.message || 'couldnt send OTP');
        } else {
            alert('OTP sent! Check your email');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const rec = new MediaRecorder(stream);
            recorderRef.current = rec;
            const chunks: BlobPart[] = [];
            rec.ondataavailable = (e) => chunks.push(e.data);
            rec.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };
            rec.start();
            setRecording(true);
            setSeconds(0);
            timer.current = setInterval(() => setSeconds(s => s + 1), 1000);
        } catch(err) {
            alert('Mic access denied. Please allow microphone.');
        }
    };

    const stopRecording = () => {
        recorderRef.current?.stop();
        setRecording(false);
        if (timer.current) clearInterval(timer.current);
    };

    const postAudio = async () => {
        if (!audioBlob) return;
        if (!otpCode) {
            alert('enter OTP first');
            return;
        }
        const res = await postRequest('/api/tweets/audio/post', {
            email: userEmail,
            otp: otpCode,
            duration: seconds,
            size: audioBlob.size
        });
        if (res.error) {
            alert(res.message || 'failed to post');
        } else if (res.tweet) {
            alert('Audio tweet posted!');
            setAudioBlob(null);
            setCurrentStep('auth');
            setOtpCode('');
            setUserEmail('');
            if (onPostSuccess) onPostSuccess();
        } else {
            alert('something went wrong');
        }
    };

    if (!mounted) return null;

    const formatTime = (s: number) => {
        return Math.floor(s / 60) + ':' + (s % 60).toString().padStart(2, '0');
    };

    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>🎤 Audio Tweet</h3>

            {timeBlocked ? (
                <p style={{ color: '#e55', fontSize: '13px', padding: '12px', background: '#1a0000', borderRadius: '4px' }}>
                    You can't upload audio right now. Try between 2 PM and 7 PM IST.
                </p>
            ) : currentStep === 'auth' ? (
                <div>
                    <input
                        type="email"
                        placeholder="enter your email here"
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', marginBottom: '8px', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="OTP"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            style={{ flex: 1, padding: '8px 10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        />
                        <button onClick={sendOtp} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #444', borderRadius: '6px', color: '#1d9bf0', fontSize: '13px', cursor: 'pointer' }}>
                            Send OTP
                        </button>
                    </div>
                    <button
                        disabled={!otpCode}
                        onClick={() => setCurrentStep('record')}
                        style={{ width: '100%', padding: '10px', background: otpCode ? '#1d9bf0' : '#333', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: otpCode ? 'pointer' : 'not-allowed' }}
                    >
                        Verify & Start Recording
                    </button>
                </div>
            ) : (
                <div>
                    {recording ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '12px', borderRadius: '6px', border: '1px solid #333' }}>
                            <span style={{ fontFamily: 'monospace', color: '#fff', fontSize: '16px' }}>⏺ {formatTime(seconds)}</span>
                            <span style={{ color: '#888', fontSize: '11px' }}>{seconds > 0 ? `${Math.round(seconds * 16000 / 1024)} KB est.` : ''}</span>
                            <button onClick={stopRecording} style={{ background: '#e55', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                ■ Stop
                            </button>
                        </div>
                    ) : audioBlob ? (
                        <div>
                            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                Recorded: {formatTime(seconds)} | Size: {(audioBlob.size / 1024).toFixed(1)} KB
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setAudioBlob(null)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>
                                    Re-record
                                </button>
                                <button onClick={postAudio} style={{ flex: 1, padding: '8px', background: '#1d9bf0', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Post Tweet
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={startRecording} style={{ width: '100%', padding: '30px', border: '2px dashed #333', borderRadius: '8px', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
                            🎙 Click to start recording
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
