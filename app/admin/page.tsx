import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { getUserCount, getLatestUsers } from "@/lib/db/users";
import { getTotalWatchlistCount } from "@/lib/db/watchlist";
import { getTotalProgressCount } from "@/lib/db/progress";
import { MotionPage } from "@/components/motion-page";
import { LayoutDashboard, Users, Activity, Settings, Database, Tv, Bookmark } from "lucide-react";
import Link from "next/link";
import { AdminUserManager } from "@/components/admin-user-manager";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mirai_session")?.value;

  if (!token) redirect("/login");

  try {
    const user = await verifyToken(token);
    if (!user.isAdmin) redirect("/");
  } catch {
    redirect("/login");
  }

  const userCount = getUserCount();
  const watchlistCount = getTotalWatchlistCount();
  const progressCount = getTotalProgressCount();
  const latestUsers = getLatestUsers(5);

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Saved", value: watchlistCount, icon: Bookmark, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Watch Progress", value: progressCount, icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "DB Health", value: "Optimal", icon: Database, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <MotionPage className="min-h-screen bg-[#0a0a0f] pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <LayoutDashboard className="h-4 w-4" />
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Management</p>
            </div>
            <h1 className="mt-2 text-4xl font-black text-white">Admin Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AdminUserManager />
            
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-white">Latest Registrations</h3>
              <div className="mt-6 space-y-4">
                {latestUsers.map((u) => (
                  <div key={u.id} className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-0">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${u.isAdmin ? 'bg-accent' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm text-white">
                        <span className="font-bold">{u.name}</span> ({u.email}) joined the server.
                        {u.isAdmin && <span className="ml-2 text-[10px] font-black uppercase text-accent">Admin</span>}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString()} {new Date(u.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-white">Server Info</h3>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Version</p>
                  <p className="mt-1 text-sm font-medium text-white">Mirai Core v1.0.4-stable</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Node Runtime</p>
                  <p className="mt-1 text-sm font-medium text-white">v20.11.0</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Uptime</p>
                  <p className="mt-1 text-sm font-medium text-white">12 days, 4 hours</p>
                </div>
                <div className="pt-4">
                  <button className="w-full rounded-xl bg-accent py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-accent/20 transition hover:scale-[1.02]">
                    Restart Services
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionPage>
  );
}
