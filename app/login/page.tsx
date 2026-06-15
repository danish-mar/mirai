import { redirect } from "next/navigation";
import { getUserCount } from "@/lib/db/users";
import LoginForm from "@/app/login/login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login · Mirai 未来",
};

export default function LoginPage() {
  if (getUserCount() === 0) {
    redirect("/setup");
  }

  return <LoginForm />;
}
