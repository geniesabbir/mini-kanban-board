'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Kanban, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-6">
          <Link href="/boards" className="flex items-center space-x-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition">
              <Kanban className="w-4 h-4 text-slate-100" />
            </div>
            <span className="font-semibold text-sm text-slate-900 tracking-tight">
              Kanban<span className="text-slate-400 font-normal ml-1">Flow</span>
            </span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link
                href="/boards"
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center space-x-1.5 ${
                  pathname === '/boards'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Boards</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right: User menu & actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Subtle Live Sync Status Pill */}
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Synced</span>
              </div>

              {/* User badge */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold tracking-wider">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-semibold text-slate-900 leading-none">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
