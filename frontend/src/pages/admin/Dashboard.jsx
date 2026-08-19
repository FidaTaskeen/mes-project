import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Settings2, Users, GitBranch, Layers, Shield, Clock } from "lucide-react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  { items: [{ label: "Admin Dashboard", path: "/admin/dashboard" }] },
  {
    title: "MASTER DATA",
    items: [
      { label: "Items", path: "/admin/items" },
      { label: "Operations", path: "/admin/operations" },
      { label: "BOM", path: "/admin/bom" },
      { label: "Routing", path: "/admin/routing" },
      { label: "Users", path: "/admin/users" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Roles & Permissions", path: "/admin/roles" },
      { label: "Settings", path: "/admin/settings" },
      { label: "Audit Logs", path: "/admin/audit-logs" },
      { label: "Backup / Restore", path: "/admin/backup" },
    ],
  },
];

const quickLinks = [
  { label: "Manage Items", path: "/admin/items", icon: Package },
  { label: "Manage Operations", path: "/admin/operations", icon: Settings2 },
  { label: "Manage BOM", path: "/admin/bom", icon: Layers },
  { label: "Manage Routing", path: "/admin/routing", icon: GitBranch },
  { label: "Manage Users", path: "/admin/users", icon: Users },
  { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/admin/dashboard-summary");
        setStats(res.data.stats);
        setRecentActivity(res.data.recentActivity || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Items", value: stats.totalItems, icon: Package, accent: "text-blue-600 bg-blue-50" },
        { label: "Total Operations", value: stats.totalOperations, icon: Settings2, accent: "text-orange-600 bg-orange-50" },
        { label: "Active Users", value: stats.activeUsers, icon: Users, accent: "text-green-600 bg-green-50" },
        { label: "Routings Defined", value: stats.routingsDefined, icon: GitBranch, accent: "text-purple-600 bg-purple-50" },
      ]
    : [];

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-slate-500 text-sm">Here's what's happening across your master data today.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <p className="col-span-4 text-slate-400 text-sm">Loading...</p>
        ) : (
          statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.accent}`}>
                <s.icon size={20} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-medium mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map((q) => (
              <Link
                key={q.path}
                to={q.path}
                className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <q.icon size={18} />
                </div>
                <span className="text-xs font-medium text-slate-700">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-medium mb-3">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {loading ? (
              <p className="p-4 text-slate-400 text-sm">Loading...</p>
            ) : recentActivity.length === 0 ? (
              <p className="p-4 text-slate-400 text-sm">No recent activity.</p>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">{a.user}</span>{" "}
                      <span className="text-slate-500">{a.action}</span>{" "}
                      <span className="font-medium">{a.entity}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(a.time).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}