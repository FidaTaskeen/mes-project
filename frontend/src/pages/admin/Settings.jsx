import { useState } from "react";
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

export default function Settings() {
  const [form, setForm] = useState({
    companyName: "TVSE",
    timeZone: "Asia/Kolkata",
    dateFormat: "DD-MM-YYYY",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later: PUT /api/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {saved && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">Settings saved!</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time Zone</label>
          <select
            value={form.timeZone}
            onChange={(e) => setForm({ ...form, timeZone: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date Format</label>
          <select
            value={form.dateFormat}
            onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            <option value="MM-DD-YYYY">MM-DD-YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
          Save Settings
        </button>
      </form>
    </Layout>
  );
}