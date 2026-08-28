import { getUserCount } from "@/lib/db/users";
import { redirect } from "next/navigation";
import LoginForm from "@/app/login/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login · Mirai 未来",
  description: "Sign in to your Mirai instance.",
};

export default function LoginPage() {
  // No users exist yet (e.g. fresh install / wiped data dir) — send to setup instead.
  if (getUserCount() === 0) {
    redirect("/setup");
  }

  return <LoginForm />;
}
