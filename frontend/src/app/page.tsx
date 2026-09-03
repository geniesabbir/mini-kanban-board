'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Kanban, ShieldCheck, ArrowRight, MoveHorizontal, Users } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/boards');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase shadow-xs">
          <span>Webbriks Full-Stack Assessment</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-tight">
          Mini Kanban Board <br />
          <span className="text-indigo-600">Drag, Drop & Collaborate</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Manage workflows, rearrange tasks with real-time drag-and-drop order consistency, and securely collaborate across teams with role-based permissions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition active:scale-[0.98]"
          >
            <span>Launch Kanban Board</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 shadow-xs transition"
          >
            Create Free Account
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <MoveHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Drag & Drop Reordering
            </h3>
            <p className="text-sm text-gray-500">
              Rearrange tasks intra-column and inter-column with transactional order consistency.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Team Board Sharing
            </h3>
            <p className="text-sm text-gray-500">
              Invite registered collaborators by email with granular Editor or Viewer privileges.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Protected Access Control
            </h3>
            <p className="text-sm text-gray-500">
              Token-based JWT authentication preventing unauthorized cross-board access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
