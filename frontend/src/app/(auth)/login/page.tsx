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
      <div className="max-w-sm w-full space-y-6 bg-white p-8 rounded-2xl shadow-2xs border border-slate-200/80">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <Kanban className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Sign in to KanbanFlow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access your workspaces
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
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
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-xs bg-white"
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
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-xs bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center space-x-1.5 shadow-xs"
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

        {/* Demo Fast Fill Section */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-2">
            <span className="flex items-center space-x-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>Assessment Demo Accounts</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice@example.com')}
              className="px-2 py-1.5 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition text-center"
            >
              Alice <span className="text-[10px] text-slate-400 block font-normal">Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bob@example.com')}
              className="px-2 py-1.5 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition text-center"
            >
              Bob <span className="text-[10px] text-slate-400 block font-normal">Editor</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('charlie@example.com')}
              className="px-2 py-1.5 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition text-center"
            >
              Charlie <span className="text-[10px] text-slate-400 block font-normal">Viewer</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
