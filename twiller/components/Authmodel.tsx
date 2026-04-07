"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, KeyRound } from 'lucide-react';
import LoadingSpinner from './loading-spinner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { useAuth } from '@/context/AuthContext';
import TwitterLogo from './TwitterLogo';
import { postRequest } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, signup, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setShowForgot(false);
    }
  }, [isOpen, initialMode]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Forgot Password state ──
  const [showForgot, setShowForgot] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotResult, setForgotResult] = useState<'none' | 'ok' | 'fail'>('none');
  const [forgotNewPwd, setForgotNewPwd] = useState('');
  const [forgotErrMsg, setForgotErrMsg] = useState('');

  // Generate password (letters only, no numbers, no special chars)
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForgotNewPwd(pwd);
  };

  // Handle reset
  const handleForgotReset = async () => {
    if (!forgotInput) {
      setForgotResult('fail');
      setForgotErrMsg('Please type your email or phone number');
      return;
    }
    setForgotResult('none');
    setForgotErrMsg('');

    const res = await postRequest('/api/auth/forgot-password', { emailOrPhone: forgotInput });
    if (res.error) {
      setForgotResult('fail');
      setForgotErrMsg(res.message || 'Something went wrong. Try again.');
    } else if (res.suggestedPassword) {
      setForgotResult('ok');
      setForgotNewPwd(res.suggestedPassword);
    } else {
      setForgotResult('fail');
      setForgotErrMsg('Unexpected error');
    }
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'signup') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }
      if (!formData.displayName.trim()) {
        newErrors.displayName = 'Display name is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isLoading) return;

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, formData.username, formData.displayName);
      }
      onClose();
      setFormData({ email: '', password: '', username: '', displayName: '' });
      setErrors({});
    } catch (error) {
      setErrors({ general: 'Authentication failed. Please try again.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setFormData({ email: '', password: '', username: '', displayName: '' });
    setShowForgot(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-black border-gray-800 text-white">
        <CardHeader className="relative pb-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-gray-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <TwitterLogo size="xl" className="text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {showForgot ? 'Reset Password' : mode === 'login' ? 'Sign in to Twiller' : 'Create your account'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Forgot Password Inline Section ── */}
          {showForgot ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm text-center">Enter your email or phone number to reset your password. You can only request this once per day.</p>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Email or phone number"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  className="bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>

              {forgotResult === 'fail' && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                  {forgotErrMsg}
                </div>
              )}

              {forgotResult === 'ok' ? (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
                  <p className="text-green-400 text-sm font-semibold mb-2">Password reset done!</p>
                  <div className="bg-black p-3 rounded border border-gray-700">
                    <span className="text-gray-500 text-[10px] block mb-1">YOUR NEW PASSWORD</span>
                    <span className="font-mono text-xl text-blue-400 tracking-wider">{forgotNewPwd}</span>
                  </div>
                  <p className="text-gray-500 text-[10px] mt-2">Letters only — no numbers or special characters. Save it somewhere safe.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Password Generator Button */}
                  {forgotNewPwd && (
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                      <span className="text-gray-500 text-[10px] block mb-1">GENERATED PASSWORD</span>
                      <span className="font-mono text-lg text-blue-400 tracking-wider">{forgotNewPwd}</span>
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={generatePassword}
                    className="w-full border-gray-600 text-blue-400 bg-transparent hover:bg-gray-900 rounded-full">
                    <KeyRound className="h-4 w-4 mr-2" /> Generate Password
                  </Button>
                  <Button type="button" onClick={handleForgotReset}
                    className="w-full bg-white text-black hover:bg-gray-200 font-semibold rounded-full">
                    Reset Password
                  </Button>
                </div>
              )}

              <div className="text-center">
                <Button variant="link" className="text-blue-400 hover:text-blue-300 text-sm" onClick={() => { setShowForgot(false); setForgotResult('none'); setForgotNewPwd(''); }}>
                  ← Back to Sign in
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Original login/signup form */}
              {errors.general && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-white">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input id="displayName" type="text" placeholder="Your display name"
                          value={formData.displayName} onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="pl-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" disabled={isLoading} />
                      </div>
                      {errors.displayName && <p className="text-red-400 text-sm">{errors.displayName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">Username</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                        <Input id="username" type="text" placeholder="username"
                          value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)}
                          className="pl-8 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" disabled={isLoading} />
                      </div>
                      {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input id="email" type="email" placeholder="Enter your email"
                      value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" disabled={isLoading} />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                      value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" disabled={isLoading} />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                </div>

                {/* Forgot Password link right below password field */}
                {mode === 'login' && (
                  <div className="text-right">
                    <Button type="button" variant="link" className="text-blue-400 hover:text-blue-300 text-sm p-0 h-auto"
                      onClick={() => setShowForgot(true)}>
                      Forgot password?
                    </Button>
                  </div>
                )}

                <Button type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-full text-lg"
                  disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    mode === 'login' ? 'Sign in' : 'Create account'
                  )}
                </Button>
              </form>

              <div className="relative">
                <Separator className="bg-gray-700" />
                <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black px-2 text-gray-400 text-sm">
                  OR
                </span>
              </div>

              <div className="text-center">
                <p className="text-gray-400">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <Button variant="link" className="text-blue-400 hover:text-blue-300 font-semibold pl-1"
                    onClick={switchMode} disabled={isLoading}>
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Button>
                </p>
              </div>

              {mode === 'signup' && (
                <div className="text-center text-xs text-gray-400">
                  By signing up, you agree to our Terms of Service and Privacy Policy, including Cookie Use.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
