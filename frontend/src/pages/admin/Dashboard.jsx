import { Link } from "react-router-dom";
import { Package, Settings2, Users, GitBranch, Layers, Shield, Clock } from "lucide-react";
import Layout from "../../components/Layout";

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

// Mock stats — later replaced by real counts from GET /api/items, /api/users, etc.
const stats = [
  { label: "Total Items", value: 3, icon: Package, accent: "text-blue-600 bg-blue-50" },
  { label: "Total Operations", value: 2, icon: Settings2, accent: "text-orange-600 bg-orange-50" },
  { label: "Active Users", value: 3, icon: Users, accent: "text-green-600 bg-green-50" },
  { label: "Routings Defined", value: 1, icon: GitBranch, accent: "text-purple-600 bg-purple-50" },
];

const quickLinks = [
  { label: "Manage Items", path: "/admin/items", icon: Package },
  { label: "Manage Operations", path: "/admin/operations", icon: Settings2 },
  { label: "Manage BOM", path: "/admin/bom", icon: Layers },
  { label: "Manage Routing", path: "/admin/routing", icon: GitBranch },
  { label: "Manage Users", path: "/admin/users", icon: Users },
  { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
];

// Mock recent activity — later replaced by GET /api/audit-logs?limit=5
const recentActivity = [
  { user: "Ashwini", action: "Created", entity: "Item ITM-002", time: "10:15 AM" },
  { user: "Ashwini", action: "Updated", entity: "Operation OP-001", time: "11:02 AM" },
  { user: "Test Supervisor", action: "Created", entity: "Job Order JO-000124", time: "12:40 PM" },
];

export default function AdminDashboard() {
  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-slate-500 text-sm">Here's what's happening across your master data today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.accent}`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick links */}
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

        {/* Recent activity */}
        <div>
          <h2 className="font-medium mb-3">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {recentActivity.map((a, i) => (
              <div key={i} className="p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Clock size={14} />
                </div>
                <div className="text-sm">
                  <p>
                    <span className="font-medium">{a.user}</span>{" "}
                    <span className="text-slate-500">{a.action.toLowerCase()}</span>{" "}
                    <span className="font-medium">{a.entity}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}