"use client";

import React, { useState } from 'react';
import {
  Home, Search, Bell, Mail, Bookmark, User, MoreHorizontal, Settings, LogOut, Globe
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TwitterLogo from '../TwitterLogo';
import { useAuth } from '@/context/AuthContext';
import { postRequest } from '@/lib/api';

/* ─── Language Switcher integrated in Sidebar ─── */

const langOptions = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'es', label: 'Spanish' },
  { id: 'french', label: 'French' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'zh', label: 'Chinese' },
];

interface SidebarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // state
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showFrenchOtp, setShowFrenchOtp] = useState(false);
  const [frenchOtp, setFrenchOtp] = useState('');
  const [langMsg, setLangMsg] = useState('');
  const [selectedLang, setSelectedLang] = useState<any>(null);

  const navigation = [
    { name: 'Home', icon: Home, current: pathname === '/', page: '/' },
    { name: 'Explore', icon: Search, current: pathname === '/explore', page: '/explore' },
    { name: 'Notifications', icon: Bell, current: pathname === '/notifications', page: '/notifications', badge: true },
    { name: 'Messages', icon: Mail, current: pathname === '/messages', page: '/messages' },
    { name: 'Bookmarks', icon: Bookmark, current: pathname === '/bookmarks', page: '/bookmarks' },
    { name: 'Profile', icon: User, current: pathname === '/profile', page: '/profile' },
    { name: 'More', icon: MoreHorizontal, current: pathname === '/more', page: '/more' },
  ];

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      router.push(page);
    }
  };

  // Choose language
  const chooseLang = async (lang: any) => {
    const stored = localStorage.getItem('twitter-user');
    let userId = '';
    if (stored) {
      try { userId = JSON.parse(stored)._id; } catch {}
    }
    if (!userId) {
      setLangMsg('Login to change language');
      return;
    }
    setSelectedLang(lang);
    setLangMsg('');

    const res = await postRequest('/api/lang/request-otp', { userId, targetLang: lang.id });
    if (res.error) {
      setLangMsg(res.message || 'Failed');
      setSelectedLang(null);
    } else if (res.method) {
      // French requires OTP — show inline OTP input
      setShowFrenchOtp(true);
      setShowLangDropdown(false);
    } else if (res.message && !res.error) {
      // Direct switch (non-French)
      setLangMsg('Language changed to ' + lang.label + '!');
      setShowLangDropdown(false);
      setTimeout(() => setLangMsg(''), 3000);
    }
  };

  // Verify OTP for French
  const verifyFrenchOtp = async () => {
    const stored = localStorage.getItem('twitter-user');
    let userId = '';
    if (stored) { try { userId = JSON.parse(stored)._id; } catch {} }

    const res = await postRequest('/api/lang/verify-and-switch', { userId, otp: frenchOtp });
    if (res.error) {
      setLangMsg(res.message || 'OTP verification failed');
    } else if (res.language) {
      setLangMsg('Language changed to French!');
      setShowFrenchOtp(false);
      setFrenchOtp('');
      setTimeout(() => setLangMsg(''), 3000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-64 border-r border-gray-800 bg-black">
      <div className="p-4">
        <TwitterLogo size="lg" className="text-white" />
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-xl py-6 px-4 rounded-full hover:bg-gray-900 ${item.current ? 'font-bold' : 'font-normal'} text-white hover:text-white`}
                onClick={() => handleNavigation(item.page)}
              >
                <item.icon className="mr-4 h-7 w-7" />
                {item.name}
                {item.badge && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                )}
              </Button>
            </li>
          ))}
        </ul>

        {/* ── Language Switcher Dropdown in Sidebar ── */}
        <div className="mt-4 px-2 relative">
          <Button
            variant="ghost"
            className="w-full justify-start text-lg py-5 px-4 rounded-full hover:bg-gray-900 text-white hover:text-white font-normal"
            onClick={() => { setShowLangDropdown(!showLangDropdown); setShowFrenchOtp(false); }}
          >
            <Globe className="mr-4 h-6 w-6" />
            Language
          </Button>

          {showLangDropdown && (
            <div className="absolute left-2 bottom-full mb-2 w-56 bg-black border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {langOptions.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => chooseLang(lang)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center justify-between"
                >
                  {lang.label}
                  {lang.id === 'french' && <span className="text-[10px] text-amber-400">OTP</span>}
                </button>
              ))}
            </div>
          )}

          {/* Inline French OTP popup */}
          {showFrenchOtp && (
            <div className="mt-2 p-3 border border-gray-700 rounded-lg bg-gray-900">
              <p className="text-xs text-gray-400 mb-2">OTP sent for switching to <b className="text-white">French</b></p>
              <input type="text" placeholder="Enter OTP" maxLength={6} value={frenchOtp} onChange={(e) => setFrenchOtp(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm text-white outline-none mb-2" />
              <div className="flex gap-2">
                <button onClick={verifyFrenchOtp} className="flex-1 py-2 bg-blue-500 text-white text-xs rounded-lg font-semibold hover:bg-blue-600">Verify</button>
                <button onClick={() => { setShowFrenchOtp(false); setFrenchOtp(''); }} className="px-3 py-2 border border-gray-600 text-gray-400 text-xs rounded-lg hover:bg-gray-800">Cancel</button>
              </div>
            </div>
          )}

          {langMsg && <p className="text-xs text-green-400 mt-1 px-2">{langMsg}</p>}
        </div>

        <div className="mt-4 px-2">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-full text-lg">
            Post
          </Button>
        </div>
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-3 rounded-full hover:bg-gray-900">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">{user.displayName}</div>
                  <div className="text-gray-400 text-sm">@{user.username}</div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-gray-800">
              <DropdownMenuItem className="text-white hover:bg-gray-900">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem className="text-white hover:bg-gray-900" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out @{user.username}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
