import { getUserCount } from "@/lib/db/users";
import { redirect } from "next/navigation";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Setup · Mirai 未来",
  description: "Initialize your Mirai instance.",
};

export default function SetupPage() {
  // If setup is already done, send to home
  if (getUserCount() > 0) {
    redirect("/");
  }

  return <SetupForm />;
}
