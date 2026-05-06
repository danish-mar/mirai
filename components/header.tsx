"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { NotificationBell } from "@/components/notification-bell";
import { User, Settings, LogOut, Menu, X, Shield } from "lucide-react";
import type { AuthUser } from "@/lib/auth/jwt";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export function Header({ user }: { user: AuthUser | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === "/login" || pathname === "/setup") return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/trending", label: "Trending" },
    { href: "/popular", label: "Popular" },
    { href: "/mylist", label: "My List" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? "header-scrolled" : "header-transparent"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-8 lg:px-12">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-baseline gap-2" id="header-logo">
              <motion.span
                className="text-xl font-black tracking-tight text-white sm:text-2xl"
                whileHover={{ scale: 1.04 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                Mirai
              </motion.span>
              <span className="header-kanji font-serif text-sm font-light tracking-[0.15em] text-accent transition-opacity duration-300">
                未来
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-5 lg:flex">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  id={`nav-${label.toLowerCase().replace(" ", "-")}`}
                  className={`relative text-sm font-medium transition-colors duration-300 nav-link ${pathname === href ? "nav-link-active" : "nav-link-inactive"}`}
                >
                  {label}
                  {pathname === href && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full nav-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link href="/admin" id="nav-admin" className="text-sm font-bold text-accent">Admin</Link>
              )}
            </nav>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search — hidden on very small screens, shown from sm */}
            <div className="hidden sm:block">
              <SearchBar />
            </div>

            {user && <NotificationBell />}

            {user ? (
              <div className="relative" ref={profileRef}>
                <motion.button
                  id="header-avatar"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full header-avatar overflow-hidden"
                  onClick={() => setProfileOpen(o => !o)}
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  aria-label="Profile menu"
                >
                  {/* Avatar or initial */}
                  <User className="size-4 text-white" />
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl z-50 shadow-2xl"
                      style={{ background: "rgba(13,13,26,0.97)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(20px)" }}
                    >
                      {/* Profile header */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-white/40 truncate">{user.email}</p>
                      </div>
                      {/* Menu items */}
                      <div className="py-1">
                        <Link href="/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:text-white hover:bg-white/5">
                          <User className="size-4" /> Profile Settings
                        </Link>
                        {user.isAdmin && (
                          <Link href="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent/80 transition-colors hover:text-accent hover:bg-white/5">
                            <Shield className="size-4" /> Admin Panel
                          </Link>
                        )}
                        <Link href="/mylist" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:text-white hover:bg-white/5">
                          <Settings className="size-4" /> My List
                        </Link>
                        <div className="my-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                        <form action="/api/auth/logout" method="POST">
                          <button type="submit"
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/80 transition-colors hover:text-red-400 hover:bg-red-500/5">
                            <LogOut className="size-4" /> Sign Out
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" id="header-login-btn" className="header-login-btn rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all duration-300">
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="header-icon-btn rounded-full p-2 transition-all duration-200 lg:hidden"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile search (below header on small screens) */}
        <div className="block px-4 pb-3 sm:hidden">
          <SearchBar />
        </div>
      </header>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40 pt-16"
            style={{ background: "rgba(6,6,15,0.97)", backdropFilter: "blur(20px)" }}
          >
            <nav className="flex flex-col gap-2 px-6 pt-8">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-xl px-4 py-3 text-lg font-semibold transition-colors ${pathname === href ? "text-white bg-accent/10 border border-accent/20" : "text-white/60 hover:text-white"}`}
                >
                  {label}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link href="/admin" className="rounded-xl px-4 py-3 text-lg font-bold text-accent">Admin</Link>
              )}
              {user && (
                <>
                  <div className="my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
                  <Link href="/profile" className="rounded-xl px-4 py-3 text-base text-white/60 hover:text-white">Profile Settings</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
