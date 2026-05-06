import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { findUserById } from "@/lib/db/users";
import { ProfileClient } from "@/components/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mirai_session")?.value;
  if (!token) redirect("/login");

  let user;
  try {
    user = await verifyToken(token);
  } catch {
    redirect("/login");
  }

  const userRecord = findUserById(user.id);

  return (
    <ProfileClient
      user={{
        ...user,
        avatarUrl: userRecord?.avatarUrl ?? null,
      }}
    />
  );
}
