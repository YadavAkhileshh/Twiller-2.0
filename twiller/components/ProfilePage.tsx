"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeft, Calendar, MapPin, Link as LinkIcon, MoreHorizontal, Camera, Settings, Bell
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import TweetCard from "./TweetCard";
import { Card, CardContent } from "./ui/card";
import Editprofile from "./Editprofile";
import axiosInstance from "@/lib/axiosInstance";
import { io, Socket } from 'socket.io-client';
import { getRequest } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);

  const [tweets, setTweets] = useState<any>([]);
  const [loading, setloading] = useState(false);

  // ── & 6 state ──
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const fetchTweets = async () => {
    try {
      setloading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  // ── Fetch User Login History ──
  const fetchLoginHistory = async (email: string) => {
    const data = await getRequest(`/loggedinuser?email=${email}`);
    if (data && data.loginHistory) {
      setLoginHistory(data.loginHistory);
    }
  };

  useEffect(() => {
    fetchTweets();
    if (user?.email) {
      fetchLoginHistory(user.email);
    }
  }, [user]);

  // ── Notification Logic ──
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    let socket: Socket | null = null;
    if (notifEnabled && typeof window !== 'undefined') {
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
    return () => { if (socket) socket.disconnect(); };
  }, [notifEnabled]);

  const toggleNotif = async () => {
    if (!notifEnabled) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotifEnabled(true);
        new Notification("Twiller Notifications", { body: "You'll get alerts for tweets about Cricket and Science" });
      } else {
        alert("Notification permission denied. Enable from browser settings.");
      }
    } else {
      setNotifEnabled(false);
      alert("Notifications turned off");
    }
  };

  if (!user) return null;
  const userTweets = tweets.filter((tweet: any) => tweet.author._id === user._id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="flex items-center px-4 py-3 space-x-8">
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-900">
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
            <p className="text-sm text-gray-400">{userTweets.length} posts</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <Button variant="ghost" size="sm" className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70">
            <Camera className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Profile Picture */}
        <div className="absolute -bottom-16 left-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-black">
              <AvatarImage src={user.avatar} alt={user.displayName} />
              <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="absolute bottom-2 right-2 p-2 rounded-full bg-black/70 hover:bg-black/90">
              <Camera className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="flex justify-end p-4">
          <Button variant="outline" className="border-gray-600 text-white bg-gray-950 font-semibold rounded-full px-6" onClick={() => setShowEditModal(true)}>
            Edit profile
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 mt-12">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
            <p className="text-gray-400">@{user.username}</p>
          </div>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-900">
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {user.bio && <p className="text-white mb-3 leading-relaxed">{user.bio}</p>}

        <div className="flex items-center space-x-4 text-gray-400 text-sm mb-3">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" /><span>{user.location ? user.location : "Earth"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <LinkIcon className="h-4 w-4" />
            <span className="text-blue-400">{user.website ? user.website : "example.com"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Joined {user.joinedDate && new Date(user.joinedDate).toLocaleDateString("en-us", { month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {/* ── & 6 tabs added here ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-800 rounded-none h-auto">
          <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold">Posts</TabsTrigger>
          <TabsTrigger value="replies" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold">Replies</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold">History</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="divide-y divide-gray-800">
            {loading ? (
              <Card className="bg-black border-none">
                <CardContent className="py-12 text-center text-gray-400">
                  <h3 className="text-2xl font-bold mb-2">You haven't posted yet</h3>
                  <p>When you post, it will show up here.</p>
                </CardContent>
              </Card>
            ) : (
              userTweets.map((tweet:any) => <TweetCard key={tweet._id} tweet={tweet} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center text-gray-400">
              <h3 className="text-2xl font-bold mb-2">You haven't replied yet</h3>
              <p>When you reply to a post, it will show up here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Login History Tab ── */}
        <TabsContent value="history" className="mt-0">
          <Card className="bg-black border-none border-t border-gray-800">
            <CardContent className="py-6">
              <h3 className="text-xl font-bold text-white mb-4">Login History</h3>
              {loginHistory && loginHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="pb-3 font-medium">Browser / OS</th>
                        <th className="pb-3 font-medium">IP Address</th>
                        <th className="pb-3 font-medium">Device Type</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {loginHistory.map((entry, idx) => (
                        <tr key={idx} className="text-gray-300">
                          <td className="py-3">{entry.browser} on {entry.os}</td>
                          <td className="py-3 text-gray-500 font-mono text-xs">{entry.ip}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs ${entry.deviceType === 'Mobile' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}`}>
                              {entry.deviceType}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500 text-xs text-right">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-gray-600 mt-4 text-center">Chrome users require OTP verification. Mobile access limited to 10 AM - 1 PM IST.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>No login history available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notification Settings Tab ── */}
        <TabsContent value="settings" className="mt-0">
          <Card className="bg-black border-none border-t border-gray-800">
            <CardContent className="py-6">
              <h3 className="text-xl font-bold text-white mb-4">Account Settings</h3>
              
              <div className="flex items-center justify-between p-4 border border-gray-800 rounded-xl bg-gray-900/20">
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-blue-400" /> Keyword Notifications</h4>
                  <p className="text-sm text-gray-400">Get browser alerts when a tweet contains <b className="text-blue-400">cricket</b> or <b className="text-blue-400">science</b></p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notifEnabled} onChange={toggleNotif} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Editprofile isopen={showEditModal} onclose={() => setShowEditModal(false)} />
    </div>
  );
}
