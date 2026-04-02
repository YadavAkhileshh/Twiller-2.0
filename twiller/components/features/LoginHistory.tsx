'use client';

import React from 'react';

export default function LoginHistoryView({ history }: { history: any[] }) {
    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>📋 Login History</h3>

            {history && history.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333' }}>
                            <th style={{ textAlign: 'left', padding: '6px 4px', color: '#888', fontWeight: 'normal' }}>Browser / OS</th>
                            <th style={{ textAlign: 'left', padding: '6px 4px', color: '#888', fontWeight: 'normal' }}>IP</th>
                            <th style={{ textAlign: 'left', padding: '6px 4px', color: '#888', fontWeight: 'normal' }}>Device</th>
                            <th style={{ textAlign: 'left', padding: '6px 4px', color: '#888', fontWeight: 'normal' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '8px 4px', color: '#ddd' }}>{entry.browser} on {entry.os}</td>
                                <td style={{ padding: '8px 4px', color: '#999' }}>{entry.ip}</td>
                                <td style={{ padding: '8px 4px' }}>
                                    <span style={{ fontSize: '11px', background: entry.deviceType === 'Mobile' ? '#1a1a2a' : '#1a2a1a', color: entry.deviceType === 'Mobile' ? '#88f' : '#8a8', padding: '2px 8px', borderRadius: '3px' }}>
                                        {entry.deviceType}
                                    </span>
                                </td>
                                <td style={{ padding: '8px 4px', color: '#666', fontSize: '11px' }}>
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p style={{ color: '#666', fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>No login history yet</p>
            )}

            <p style={{ fontSize: '10px', color: '#555', marginTop: '12px', lineHeight: '1.4' }}>
                Note: Edge users get direct access. Chrome users need OTP verification. Mobile access is limited to 10 AM - 1 PM IST.
            </p>
        </div>
    );
}
