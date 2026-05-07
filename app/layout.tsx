import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";

import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Mirai",
  description: "Self-hosted anime streaming platform"
};

import { findUserById } from "@/lib/db/users";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("mirai_session")?.value;

  let user = null;
  let userRecord = null;

  if (token) {
    try {
      user = await verifyToken(token);
      userRecord = findUserById(user.id);
    } catch {}
  }
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        <Header user={user} avatarUrl={userRecord?.avatarUrl} />
        <main>{children}</main>
      </body>
    </html>
  );
}
