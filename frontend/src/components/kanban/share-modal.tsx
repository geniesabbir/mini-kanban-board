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
      setInviteSuccess(`Invited ${email.trim()} successfully!`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Board Members</h2>
              <p className="text-xs text-gray-500">
                Manage who has access to this Kanban board
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite Form (only for board owner) */}
        {isOwner ? (
          <form onSubmit={handleInvite} className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Invite Collaborator
            </h3>

            {inviteError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold bg-white"
              >
                <option value="EDITOR">Editor (Can edit)</option>
                <option value="VIEWER">Viewer (Read only)</option>
              </select>
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-60 transition"
              >
                {isInviting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center space-x-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Only the board owner can invite or remove collaborators.</span>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Current Members ({1 + members.length})
          </h4>

          {/* Owner row */}
          {owner && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/40 border border-indigo-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {owner.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {owner.name}
                  </p>
                  <p className="text-xs text-gray-500">{owner.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Owner
              </span>
            </div>
          )}

          {/* Collaborator rows */}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold">
                  {member.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {member.user.name}
                  </p>
                  <p className="text-xs text-gray-500">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isOwner ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as Role)
                      }
                      className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                      title="Remove Collaborator"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      {removingId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      member.role === 'EDITOR'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
