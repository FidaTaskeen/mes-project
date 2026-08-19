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
  const [stats, setStats] = useState([
    { label: "Total Items", value: "—", icon: Package, accent: "text-blue-600 bg-blue-50" },
    { label: "Total Operations", value: "—", icon: Settings2, accent: "text-orange-600 bg-orange-50" },
    { label: "Active Users", value: "—", icon: Users, accent: "text-green-600 bg-green-50" },
    { label: "Routings Defined", value: "—", icon: GitBranch, accent: "text-purple-600 bg-purple-50" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const [itemsRes, opsRes, usersRes, routingsRes] = await Promise.all([
        axiosInstance.get("/items", { params: { limit: 1 } }),
        axiosInstance.get("/operations", { params: { limit: 1 } }),
        axiosInstance.get("/users", { params: { limit: 1 } }),
        axiosInstance.get("/routings", { params: { limit: 1 } }),
      ]);

      setStats([
        { label: "Total Items", value: itemsRes.data.total ?? itemsRes.data.items?.length ?? 0, icon: Package, accent: "text-blue-600 bg-blue-50" },
        { label: "Total Operations", value: opsRes.data.total ?? opsRes.data.operations?.length ?? 0, icon: Settings2, accent: "text-orange-600 bg-orange-50" },
        { label: "Active Users", value: usersRes.data.total ?? usersRes.data.users?.length ?? 0, icon: Users, accent: "text-green-600 bg-green-50" },
        { label: "Routings Defined", value: routingsRes.data.total ?? routingsRes.data.routings?.length ?? 0, icon: GitBranch, accent: "text-purple-600 bg-purple-50" },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-slate-500 text-sm">Here's what's happening across your master data today.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.accent}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold">{loading ? "…" : s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl">
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
    </Layout>
  );
}