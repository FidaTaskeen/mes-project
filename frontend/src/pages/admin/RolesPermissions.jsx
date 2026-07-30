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

const roles = [
  { role: "Admin", permissions: ["Manage Items", "Manage Operations", "Manage BOM", "Manage Routing", "Manage Users", "System Settings"] },
  { role: "Supervisor", permissions: ["Create Job Orders", "View Job Orders", "Production Monitoring", "Reports"] },
  { role: "Operator", permissions: ["Scan Job Orders", "Production Entry", "View Own History"] },
];

export default function RolesPermissions() {
  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Roles & Permissions</h1>

      <div className="space-y-6">
        {roles.map((r) => (
          <div key={r.role} className="bg-white rounded-lg shadow p-6">
            <h2 className="font-medium mb-3">{r.role}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {r.permissions.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked readOnly className="rounded" />
                  {perm}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}