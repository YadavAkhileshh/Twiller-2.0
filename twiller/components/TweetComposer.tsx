import { useAuth } from "@/context/AuthContext";
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Image, Smile, Calendar, MapPin, BarChart3, Globe, Mic, Square, X, CreditCard } from "lucide-react";
import { Separator } from "./ui/separator";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";
import { postRequest } from "@/lib/api";

/* ─── Audio Tweet ─── */
/* ─── Subscription Plan Check ─── */

const TweetComposer = ({ onTweetPosted }: any) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageurl, setimageurl] = useState("");
  const maxLength = 200;

  // ── state: Audio Recording ──
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [audioTimeBlocked, setAudioTimeBlocked] = useState(false);
  const [audioEmail, setAudioEmail] = useState("");
  const [audioOtp, setAudioOtp] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [audioStep, setAudioStep] = useState<"otp" | "record" | "preview">("otp");
  const [audioMsg, setAudioMsg] = useState("");
  const timerRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // ── state: Subscription limit ──
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [payLoading, setPayLoading] = useState("");

  const plans = [
    { id: "free", name: "Free", price: 0, tweetLimit: "1 tweet" },
    { id: "bronze", name: "Bronze", price: 100, tweetLimit: "3 tweets" },
    { id: "silver", name: "Silver", price: 300, tweetLimit: "5 tweets" },
    { id: "gold", name: "Gold", price: 1000, tweetLimit: "Unlimited" },
  ];

  // Load Razorpay script once
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
    }
  }, []);

  // ── Check IST time for audio ──
  const handleMicClick = () => {
    const now = new Date();
    const istHour = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
    if (istHour < 14 || istHour >= 19) {
      setAudioTimeBlocked(true);
      setShowAudioPanel(true);
      return;
    }
    setAudioTimeBlocked(false);
    setShowAudioPanel(true);
    setAudioStep("otp");
    setAudioMsg("");
    setAudioBlob(null);
    setAudioOtp("");
    if (user?.email) setAudioEmail(user.email);
  };

  const sendAudioOtp = async () => {
    if (!audioEmail || !audioEmail.includes("@")) {
      setAudioMsg("Enter a valid email");
      return;
    }
    const res = await postRequest("/api/tweets/audio/request-otp", { email: audioEmail });
    if (res.error) {
      setAudioMsg(res.message || "Could not send OTP");
    } else {
      setAudioMsg("OTP sent! Check your email");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => setAudioBlob(new Blob(chunks, { type: "audio/webm" }));
      rec.start();
      setRecording(true);
      setAudioSeconds(0);
      timerRef.current = setInterval(() => setAudioSeconds((s) => s + 1), 1000);
    } catch {
      setAudioMsg("Microphone access denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setAudioStep("preview");
  };

  const postAudioTweet = async () => {
    if (!audioBlob || !audioOtp) {
      setAudioMsg("Enter OTP first");
      return;
    }
    const res = await postRequest("/api/tweets/audio/post", {
      email: audioEmail,
      otp: audioOtp,
      duration: audioSeconds,
      size: audioBlob.size,
    });
    if (res.error) {
      setAudioMsg(res.message || "Failed to post");
    } else if (res.tweet) {
      setAudioMsg("");
      setShowAudioPanel(false);
      setAudioBlob(null);
      setAudioStep("otp");
      setAudioOtp("");
      if (onTweetPosted) onTweetPosted(res.tweet);
    }
  };

  const formatTime = (s: number) => Math.floor(s / 60) + ":" + (s % 60).toString().padStart(2, "0");

  // ── Submit tweet with plan check ──
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setShowUpgrade(false);
    setIsLoading(true);
    try {
      const tweetdata = { author: user._id, content, image: imageurl };
      const res = await axiosInstance.post("/post", tweetdata);
      onTweetPosted(res.data);
      setContent("");
      setimageurl("");
    } catch (error: any) {
      // If backend returns 403 for plan limit, show inline upgrade
      if (error.response?.status === 403 || error.response?.data?.limitReached) {
        setShowUpgrade(true);
        setUpgradeMsg(error.response?.data?.message || "You have reached your daily tweet limit. Upgrade your plan for more tweets.");
      } else {
        console.log(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle plan upgrade payment ──
  const handleUpgrade = async (planId: string) => {
    const stored = localStorage.getItem("twitter-user");
    let userId = user?._id;
    let userEmail = user?.email;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        userId = parsed._id;
        userEmail = parsed.email;
      } catch {}
    }
    if (!userId || !userEmail) {
      setUpgradeMsg("You need to be logged in");
      return;
    }

    // IST time check for payment window
    const now = new Date();
    const istHour = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
    if (istHour < 10 || istHour >= 11) {
      setUpgradeMsg("Payment is only available between 10 AM and 11 AM IST.");
      return;
    }

    setPayLoading(planId);
    const res = await postRequest("/api/sub/subscribe", { userId, planType: planId, email: userEmail });
    if (res.error) {
      setUpgradeMsg(res.message || "Payment failed");
      setPayLoading("");
      return;
    }

    if (res.orderId && res.amount && (window as any).Razorpay) {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: res.amount,
        currency: "INR",
        name: "Twiller",
        description: `${planId} plan`,
        order_id: res.orderId,
        handler: async function (response: any) {
          const verifyRes = await postRequest("/api/sub/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            userId,
            planType: planId,
            email: userEmail,
          });
          if (verifyRes.error) {
            setUpgradeMsg("Payment verification failed");
          } else {
            setShowUpgrade(false);
            setUpgradeMsg("");
          }
        },
        prefill: { email: userEmail },
        theme: { color: "#1d9bf0" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    }
    setPayLoading("");
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.8;
  if (!user) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    const image = e.target.files[0];
    const formdataimg = new FormData();
    formdataimg.set("image", image);
    try {
      const res = await axios.post(
        "https://api.imgbb.com/1/upload?key=97f3fb960c3520d6a88d7e29679cf96f",
        formdataimg
      );
      const url = res.data.data.display_url;
      if (url) setimageurl(url);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-black border-gray-800 border-x-0 border-t-0 rounded-none">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-transparent border-none text-xl text-white placeholder-gray-500 resize-none min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              {/* ── Audio Recording Panel (inline in composer) ── */}
              {showAudioPanel && (
                <div className="mt-3 p-3 border border-gray-700 rounded-lg bg-gray-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white flex items-center gap-1"><Mic className="h-4 w-4 text-blue-400" /> Audio Tweet</span>
                    <button type="button" onClick={() => { setShowAudioPanel(false); setRecording(false); if (timerRef.current) clearInterval(timerRef.current); }} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>

                  {audioTimeBlocked ? (
                    <p className="text-red-400 text-xs p-2 bg-red-900/20 rounded">Audio tweets can only be posted between 2 PM and 7 PM IST.</p>
                  ) : audioStep === "otp" ? (
                    <div className="space-y-2">
                      <input type="email" placeholder="Your email" value={audioEmail} onChange={(e) => setAudioEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-sm text-white outline-none" />
                      <div className="flex gap-2">
                        <input type="text" placeholder="OTP" value={audioOtp} onChange={(e) => setAudioOtp(e.target.value)}
                          className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded text-sm text-white outline-none" />
                        <button type="button" onClick={sendAudioOtp} className="px-3 py-2 border border-gray-600 rounded text-sm text-blue-400 hover:bg-gray-800">Send OTP</button>
                      </div>
                      <button type="button" disabled={!audioOtp} onClick={() => setAudioStep("record")}
                        className={`w-full py-2 rounded-full text-sm font-semibold ${audioOtp ? "bg-blue-500 text-white cursor-pointer" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}>
                        Verify & Start Recording
                      </button>
                    </div>
                  ) : audioStep === "record" ? (
                    <div>
                      {recording ? (
                        <div className="flex items-center justify-between p-3 bg-black rounded border border-gray-700">
                          <span className="font-mono text-white">⏺ {formatTime(audioSeconds)}</span>
                          <button type="button" onClick={stopRecording} className="px-3 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1"><Square className="h-3 w-3" /> Stop</button>
                        </div>
                      ) : (
                        <button type="button" onClick={startRecording} className="w-full py-6 border-2 border-dashed border-gray-700 rounded text-gray-500 text-sm hover:border-gray-500">
                          🎙 Click to start recording
                        </button>
                      )}
                    </div>
                  ) : audioStep === "preview" && audioBlob ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Recorded: {formatTime(audioSeconds)} | Size: {(audioBlob.size / 1024).toFixed(1)} KB</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setAudioBlob(null); setAudioStep("record"); }} className="flex-1 py-2 border border-gray-600 rounded-full text-sm text-white hover:bg-gray-800">Re-record</button>
                        <button type="button" onClick={postAudioTweet} className="flex-1 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600">Post Audio Tweet</button>
                      </div>
                    </div>
                  ) : null}

                  {audioMsg && <p className="text-xs mt-2 text-amber-400">{audioMsg}</p>}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-4 text-blue-400">
                  <label htmlFor="tweetImage" className="p-2 rounded-full hover:bg-blue-900/20 cursor-pointer">
                    <Image className="h-5 w-5" />
                    <input type="file" accept="image/*" id="tweetImage" className="hidden" onChange={handlePhotoUpload} disabled={isLoading} />
                  </label>
                  <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-blue-900/20"><BarChart3 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-blue-900/20"><Smile className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-blue-900/20"><Calendar className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-blue-900/20"><MapPin className="h-5 w-5" /></Button>
                  {/* Mic button */}
                  <Button type="button" variant="ghost" size="sm" className="p-2 rounded-full hover:bg-blue-900/20" onClick={handleMicClick}>
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-semibold">Everyone can reply</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {characterCount > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 transform -rotate-90">
                            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-700" />
                            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none"
                              strokeDasharray={`${2 * Math.PI * 14}`}
                              strokeDashoffset={`${2 * Math.PI * 14 * (1 - characterCount / maxLength)}`}
                              className={isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-blue-500"} />
                          </svg>
                        </div>
                        {isNearLimit && (
                          <span className={`text-sm ${isOverLimit ? "text-red-500" : "text-yellow-500"}`}>
                            {maxLength - characterCount}
                          </span>
                        )}
                      </div>
                    )}
                    <Separator orientation="vertical" className="h-6 bg-gray-700" />
                    <Button type="submit" disabled={!content.trim() || isOverLimit || isLoading}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full px-6">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* ── Inline Subscription Upgrade Prompt ── */}
            {showUpgrade && (
              <div className="mt-4 p-4 border border-amber-800/50 rounded-lg bg-amber-900/10">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-white">Upgrade Your Plan</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{upgradeMsg}</p>
                <div className="grid grid-cols-4 gap-2">
                  {plans.map((p) => (
                    <div key={p.id} className="border border-gray-700 rounded-lg p-2 text-center">
                      <p className="text-xs font-semibold text-white">{p.name}</p>
                      <p className="text-sm font-bold text-white">₹{p.price}</p>
                      <p className="text-[10px] text-gray-500 mb-1">{p.tweetLimit}/day</p>
                      <button onClick={() => handleUpgrade(p.id)} disabled={payLoading === p.id}
                        className="w-full py-1 bg-blue-500 text-white text-[10px] rounded font-semibold hover:bg-blue-600 disabled:opacity-50">
                        {payLoading === p.id ? "..." : p.price === 0 ? "Current" : "Pay"}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center">Payment window: 10 – 11 AM IST only</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TweetComposer;
