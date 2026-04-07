'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeaturesRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/'); }, [router]);
    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>     
            <p>Redirecting to home...</p>
        </div>
    );
}
