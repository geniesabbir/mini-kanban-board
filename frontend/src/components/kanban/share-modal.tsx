'use client';

import React, { useState } from 'react';
import { BoardMember, Role } from '../../types';
import { api } from '../../lib/api';
import {
  X,
  UserPlus,
  Users,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  isOwner: boolean;
  owner?: { id: string; name: string; email: string };
  members: BoardMember[];
  onMembersUpdated: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  boardId,
  isOwner,
  owner,
  members,
  onMembersUpdated,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('EDITOR');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await api.post(`/api/boards/${boardId}/members`, {
        email: email.trim(),
        role,
      });
      setInviteSuccess(`Invited ${email.trim()} successfully.`);
      setEmail('');
      onMembersUpdated();
    } catch (err: any) {
      setInviteError(
        err.response?.data?.message || 'Failed to add collaborator.',
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      await api.delete(`/api/boards/${boardId}/members/${memberId}`);
      onMembersUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await api.patch(`/api/boards/${boardId}/members/${memberId}`, {
        role: newRole,
      });
      onMembersUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Board Collaborators</h2>
            <p className="text-xs text-slate-500">Manage member permissions for this board</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invite Form (Owner only) */}
        {isOwner ? (
          <form
            onSubmit={handleInvite}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
          >
            <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Invite by Email
            </h3>

            {inviteError && (
              <div className="p-2 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="p-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registered-user@example.com"
                className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-white"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="px-2 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs bg-white font-medium text-slate-700"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs disabled:opacity-50 transition"
              >
                {isInviting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>Invite</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-xs flex items-center space-x-2">
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Only the board owner can invite or change collaborator roles.</span>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Members</span>
            <span>{1 + members.length} total</span>
          </div>

          {/* Owner row */}
          {owner && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                  {owner.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                    {owner.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{owner.email}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-200 text-slate-800 shrink-0">
                Owner
              </span>
            </div>
          )}

          {/* Collaborator rows */}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {member.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                    {member.user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {isOwner ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as Role)
                      }
                      className="text-xs font-medium border border-slate-200 rounded px-1.5 py-0.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                      title="Remove Member"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      {removingId === member.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                      member.role === 'EDITOR'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {member.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
