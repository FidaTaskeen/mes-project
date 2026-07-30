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

// Mock data — later replaced by GET /api/audit-logs
const logs = [
  { id: 1, user: "Ashwini", action: "Created", entity: "Item ITM-002", timestamp: "2026-07-29 10:15 AM" },
  { id: 2, user: "Ashwini", action: "Updated", entity: "Operation OP-001", timestamp: "2026-07-29 11:02 AM" },
  { id: 3, user: "Test Supervisor", action: "Created", entity: "Job Order JO-000124", timestamp: "2026-07-29 12:40 PM" },
  { id: 4, user: "Ashwini", action: "Deleted", entity: "User test@example.com", timestamp: "2026-07-30 09:05 AM" },
];

const actionColors = {
  Created: "bg-green-100 text-green-700",
  Updated: "bg-blue-100 text-blue-700",
  Deleted: "bg-red-100 text-red-700",
};

export default function AuditLogs() {
  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3">{log.user}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${actionColors[log.action]}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">{log.entity}</td>
                <td className="px-4 py-3 text-slate-500">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}