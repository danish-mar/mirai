"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Camera, Save, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { MotionPage } from "@/components/motion-page";
import type { AuthUser } from "@/lib/auth/jwt";

type Status = "idle" | "saving" | "success" | "error";

function Avatar({ avatarUrl, name, size = 96 }: { avatarUrl?: string | null; name: string; size?: number }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-bold"
      style={{
        width: size, height: size,
        background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
        fontSize: size / 3,
      }}
    >
      {initials}
    </div>
  );
}

export function ProfileClient({ user }: { user: AuthUser & { avatarUrl?: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileStatus, setProfileStatus] = useState<Status>("idle");
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [profileMsg, setProfileMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const saveProfile = async () => {
    setProfileStatus("saving");
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarUrl: avatarUrl.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setProfileStatus("success");
      setProfileMsg("Profile updated!");
      router.refresh();
    } catch (e: any) {
      setProfileStatus("error");
      setProfileMsg(e.message);
    }
    setTimeout(() => setProfileStatus("idle"), 3000);
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) { setPwStatus("error"); setPwMsg("Passwords don't match"); return; }
    if (newPw.length < 8) { setPwStatus("error"); setPwMsg("Password must be at least 8 characters"); return; }
    setPwStatus("saving");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setPwStatus("success");
      setPwMsg("Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      setPwStatus("error");
      setPwMsg(e.message);
    }
    setTimeout(() => setPwStatus("idle"), 3000);
  };

  return (
    <MotionPage className="min-h-screen pt-24 pb-20" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.3em] hero-accent-glow">Account</span>
            <div className="h-px w-8 hero-accent-line" />
          </div>
          <h1 className="text-3xl font-black text-white">Profile Settings</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Manage your Mirai account</p>
        </div>

        {/* ── Avatar & basic info ── */}
        <div className="mb-6 overflow-hidden rounded-2xl" style={{ background: "rgba(13,13,26,0.7)", border: "1px solid rgba(139,92,246,0.15)", backdropFilter: "blur(20px)" }}>
          <div className="border-b px-6 py-4" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
            <h2 className="text-base font-bold text-white">Profile</h2>
          </div>
          <div className="p-6 space-y-5">
            {/* Avatar preview */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar avatarUrl={avatarUrl || user.avatarUrl} name={name} size={72} />
                <div
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full"
                  style={{ background: "var(--accent)", border: "2px solid var(--background)" }}
                >
                  <Camera className="size-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{name || "Your Name"}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
                {user.isAdmin && (
                  <span className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white score-badge">Admin</span>
                )}
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="profile-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                placeholder="Your name"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="profile-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Paste a direct image URL for your avatar</p>
            </div>

            {/* Status */}
            {profileStatus !== "idle" && profileStatus !== "saving" && (
              <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${profileStatus === "success" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                {profileStatus === "success" ? <CheckCircle className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                {profileMsg}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={profileStatus === "saving"}
              className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {profileStatus === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </button>
          </div>
        </div>

        {/* ── Change password ── */}
        <div className="overflow-hidden rounded-2xl" style={{ background: "rgba(13,13,26,0.7)", border: "1px solid rgba(139,92,246,0.15)", backdropFilter: "blur(20px)" }}>
          <div className="border-b px-6 py-4" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Lock className="size-4 text-accent" /> Password</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Current Password", value: currentPw, set: setCurrentPw, placeholder: "••••••••" },
              { label: "New Password", value: newPw, set: setNewPw, placeholder: "8+ characters" },
              { label: "Confirm New Password", value: confirmPw, set: setConfirmPw, placeholder: "••••••••" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="profile-input w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                  placeholder={placeholder}
                />
              </div>
            ))}

            {pwStatus !== "idle" && pwStatus !== "saving" && (
              <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${pwStatus === "success" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                {pwStatus === "success" ? <CheckCircle className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                {pwMsg}
              </div>
            )}

            <button
              onClick={savePassword}
              disabled={pwStatus === "saving"}
              className="btn-ghost flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white/80 disabled:opacity-50"
            >
              {pwStatus === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Update Password
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="mt-6 rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
          Member since {user.name ? new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"} · Mirai · 未来
        </div>
      </div>
    </MotionPage>
  );
}
