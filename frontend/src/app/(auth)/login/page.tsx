'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import { Kanban, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-200/80">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Kanban className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Sign in to access your boards and collaborate
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 transition flex items-center justify-center space-x-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-500 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick Demo Accounts (Assessment Testing)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice@example.com')}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-gray-700 hover:text-indigo-700 transition text-center"
            >
              Alice (Owner)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bob@example.com')}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-gray-700 hover:text-indigo-700 transition text-center"
            >
              Bob (Editor)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('charlie@example.com')}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-gray-700 hover:text-indigo-700 transition text-center"
            >
              Charlie (Viewer)
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
