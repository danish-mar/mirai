import { getUserCount } from "@/lib/db/users";
import { redirect } from "next/navigation";
import SetupForm from "@/app/setup/setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Setup · Mirai 未来",
  description: "Initialize your Mirai instance.",
};

export default function SetupPage() {
  if (getUserCount() > 0) {
    redirect("/");
  }

  return <SetupForm />;
}
