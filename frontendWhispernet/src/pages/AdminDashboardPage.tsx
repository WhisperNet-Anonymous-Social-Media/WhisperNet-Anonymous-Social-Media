import React, { useEffect, useState } from "react";
import API from "@/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  pseudonym: string;
  isAdmin: boolean;
  isBanned: boolean;
  verified: boolean;
};

type ReportedPost = {
  _id: string;
  pseudonym: string;
  content: string;
  reports?: Array<{ reporter: string; reason: string; createdAt: string }>;
};

type Overview = {
  users: number;
  posts: number;
  reportedPosts: number;
  bannedUsers: number;
};

export const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: ov }, { data: rs }, { data: us }] = await Promise.all([
        API.get("/api/admin/overview"),
        API.get("/api/admin/reports"),
        API.get("/api/admin/users"),
      ]);
      setOverview(ov);
      setReports(rs || []);
      setUsers(us || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resolveReport = async (postId: string, action: "dismiss" | "delete") => {
    try {
      await API.patch(`/api/admin/reports/${postId}`, { action });
      toast.success(action === "dismiss" ? "Report dismissed" : "Post deleted");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    try {
      await API.patch(`/api/admin/users/${userId}/ban`, { isBanned: !isBanned });
      toast.success(!isBanned ? "User banned" : "User unbanned");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not update user");
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await API.patch(`/api/admin/users/${userId}/admin`, { isAdmin: !isAdmin });
      toast.success(!isAdmin ? "Admin granted" : "Admin revoked");
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not update role");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading admin dashboard...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Admin Control Center</h1>
        <p className="text-slate-400 mt-1">Moderation, user controls, and launch readiness.</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="professional-panel p-4"><p className="text-slate-400 text-xs">Users</p><p className="text-2xl font-bold">{overview.users}</p></div>
          <div className="professional-panel p-4"><p className="text-slate-400 text-xs">Posts</p><p className="text-2xl font-bold">{overview.posts}</p></div>
          <div className="professional-panel p-4"><p className="text-slate-400 text-xs">Reported</p><p className="text-2xl font-bold">{overview.reportedPosts}</p></div>
          <div className="professional-panel p-4"><p className="text-slate-400 text-xs">Banned</p><p className="text-2xl font-bold">{overview.bannedUsers}</p></div>
        </div>
      )}

      <section className="professional-panel p-5">
        <h2 className="text-lg font-semibold mb-4">Reported Whispers</h2>
        {!reports.length ? (
          <p className="text-slate-400">No reports right now.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((post) => (
              <div key={post._id} className="border border-slate-700 rounded-xl p-4 bg-slate-950/60">
                <p className="text-sm text-slate-400 mb-2">By {post.pseudonym}</p>
                <p className="text-slate-200 mb-3">{post.content || "(media-only whisper)"}</p>
                <div className="text-xs text-slate-400 mb-3">
                  {(post.reports || []).map((r, idx) => (
                    <div key={`${r.reporter}-${idx}`}>Reported by {r.reporter} • {r.reason}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => resolveReport(post._id, "dismiss")}>Dismiss</Button>
                  <Button size="sm" variant="destructive" onClick={() => resolveReport(post._id, "delete")}>Delete Post</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="professional-panel p-5">
        <h2 className="text-lg font-semibold mb-4">User Controls</h2>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-700 rounded-xl p-3 bg-slate-950/60">
              <div>
                <p className="font-medium text-slate-100">{u.pseudonym || u.name}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={u.isBanned ? "secondary" : "destructive"} onClick={() => toggleBan(u._id, u.isBanned)}>
                  {u.isBanned ? "Unban" : "Ban"}
                </Button>
                <Button size="sm" variant={u.isAdmin ? "secondary" : "default"} onClick={() => toggleAdmin(u._id, u.isAdmin)}>
                  {u.isAdmin ? "Revoke Admin" : "Make Admin"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

