"use client";

import React from 'react';
import Sidebar from './Sidebar';
import RightSidebar from './Rightsidebar';
import { useAuth } from '@/context/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="flex w-full max-w-[1300px]">
        {/* Left Sidebar */}
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 border-x border-gray-800 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar */}
        <div className="hidden lg:block sticky top-0 h-screen">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}