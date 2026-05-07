"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Camera, Save, Lock, Loader2, CheckCircle, AlertCircle, X, ZoomIn, ZoomOut, Move } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Cropping state ──
  const [cropModal, setCropModal] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPendingImage(event.target?.result as string);
      setCropModal(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const performCrop = () => {
    if (!pendingImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);

      const scale = size / 200;
      
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(zoom * scale, zoom * scale);
      ctx.translate(offset.x, offset.y);
      
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      setAvatarUrl(base64);
      setCropModal(false);
      setPendingImage(null);
    };
    img.src = pendingImage;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setOffset(prev => ({ x: prev.x + dx / zoom, y: prev.y + dy / zoom }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

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
      {/* ── Crop Modal ── */}
      <AnimatePresence>
        {cropModal && pendingImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.8)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-3xl"
              style={{ background: "#0d0d1a", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            >
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
                <h3 className="font-bold text-white">Crop Avatar</h3>
                <button onClick={() => setCropModal(false)} className="rounded-lg p-1 hover:bg-white/10" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-8">
                <div 
                  className="relative mx-auto size-[200px] cursor-move overflow-hidden rounded-full border-2 border-accent"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    src={pendingImage}
                    alt=""
                    draggable={false}
                    className="absolute max-w-none origin-center"
                    style={{
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                      top: "50%",
                      left: "50%",
                      transition: isDragging.current ? "none" : "transform 0.1s ease-out"
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-full border border-white/10" />
                </div>

                <p className="mt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Drag to position · Scroll to zoom</p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <ZoomOut className="size-4 text-white/40" />
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.01"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
                    />
                    <ZoomIn className="size-4 text-white/40" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setCropModal(false)}
                      className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:bg-white/5"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={performCrop}
                      className="btn-primary flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                    >
                      Apply Crop
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
            {/* Avatar preview and upload */}
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar avatarUrl={avatarUrl || user.avatarUrl} name={name} size={72} />
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <Camera className="size-6 text-white" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full"
                  style={{ background: "var(--accent)", border: "2px solid var(--background)" }}
                >
                  <Camera className="size-3 text-white" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{name || "Your Name"}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{user.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
                >
                  Upload New Avatar
                </button>
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
