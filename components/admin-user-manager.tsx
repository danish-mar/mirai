"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, Shield, Mail, User as UserIcon, Lock, CheckCircle2, Trash2, AlertCircle } from "lucide-react";

type UserRecord = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
};

export function AdminUserManager() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) setUsers(data.data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, isAdmin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setMessage({ type: "success", text: `User ${name} created successfully!` });
      setName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Deletion failed");
      
      setMessage({ type: "success", text: `User ${userName} deleted.` });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* Create User Form */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <UserPlus className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-white">Invite New User</h3>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@mirai.app"
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Initial Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => setIsAdmin(!isAdmin)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                isAdmin ? "border-accent bg-accent/20 text-accent" : "border-white/10 text-zinc-500"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Administrator Privileges
            </button>
          </div>

          {message.text && (
            <div className={`rounded-lg p-3 text-xs font-bold flex items-center gap-2 ${
              message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User Account"}
          </button>
        </form>
      </div>

      {/* User List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h3 className="text-xl font-bold text-white mb-6">Manage Users</h3>
        
        {isFetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${u.isAdmin ? 'bg-accent/20 text-accent' : 'bg-white/10 text-zinc-400'}`}>
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{u.name}</p>
                      {u.isAdmin && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-accent">Admin</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteUser(u.id, u.name)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-red-500/20 hover:text-red-500"
                  title="Delete User"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
