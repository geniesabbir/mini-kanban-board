'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Kanban, LogOut, LayoutDashboard, ChevronRight, Sparkles } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center space-x-6">
          <Link
            href="/boards"
            className="flex items-center space-x-2.5 group transition-transform active:scale-98"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-200">
              <Kanban className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center">
              Kanban
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent ml-1 font-extrabold">
                Flow
              </span>
            </span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link
                href="/boards"
                className={`px-2.5 py-1 rounded-md font-medium transition-all duration-150 flex items-center space-x-1.5 ${
                  pathname === '/boards'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Boards</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right: Live Sync, User Badge & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Pulsing Sync Status Pill */}
              <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-700 font-semibold shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Sync</span>
              </div>

              {/* User badge with vibrant gradient avatar */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center text-xs font-bold tracking-wider shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-100">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-bold text-slate-800 leading-none">
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
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/25 transition active:scale-95"
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
