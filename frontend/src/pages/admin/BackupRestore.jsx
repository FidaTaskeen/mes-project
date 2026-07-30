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

export default function BackupRestore() {
  const [message, setMessage] = useState("");

  const handleBackup = () => {
    // Later: POST /api/backup — triggers a DB export on the server
    setMessage("Backup started. You'll be notified when it's complete.");
  };

  const handleRestore = () => {
    // Later: POST /api/restore — with an uploaded backup file
    setMessage("Restore requires uploading a backup file (feature coming soon).");
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Backup / Restore</h1>

      {message && (
        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded mb-4">{message}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
        <div>
          <h2 className="font-medium mb-1">Backup Database</h2>
          <p className="text-sm text-slate-500 mb-3">
            Creates a full export of all master data and transaction records.
          </p>
          <button
            onClick={handleBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            Backup Now
          </button>
        </div>

        <hr />

        <div>
          <h2 className="font-medium mb-1">Restore Database</h2>
          <p className="text-sm text-slate-500 mb-3">
            Upload a previous backup file to restore the system to that state.
          </p>
          <button
            onClick={handleRestore}
            className="border border-slate-300 px-4 py-2 rounded text-sm font-medium hover:bg-slate-50"
          >
            Restore from File
          </button>
        </div>
      </div>
    </Layout>
  );
}