'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { Kanban, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : 'Failed to sign in. Please check your credentials.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/70 py-12 px-4 sm:px-6">
      <div className="max-w-sm w-full space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 animate-pop-in">
        <div className="text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/25">
            <Kanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Sign in to KanbanFlow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Enter your credentials to access your collaborative boards
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-indigo-500/25 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Fill Section with Color Badges */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-2">
            <span className="flex items-center space-x-1">
              <KeyRound className="w-3 h-3 text-indigo-500" />
              <span>Assessment Demo Accounts</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice@example.com')}
              className="px-2 py-2 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 text-[11px] font-bold text-indigo-900 transition-all text-center active:scale-95 shadow-2xs"
            >
              Alice <span className="text-[10px] text-indigo-500 block font-medium">Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bob@example.com')}
              className="px-2 py-2 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 text-[11px] font-bold text-emerald-900 transition-all text-center active:scale-95 shadow-2xs"
            >
              Bob <span className="text-[10px] text-emerald-600 block font-medium">Editor</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('charlie@example.com')}
              className="px-2 py-2 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-100 hover:border-sky-300 text-[11px] font-bold text-sky-900 transition-all text-center active:scale-95 shadow-2xs"
            >
              Charlie <span className="text-[10px] text-sky-600 block font-medium">Viewer</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
