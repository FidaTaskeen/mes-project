import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Operator Dashboard", path: "/operator/dashboard" },
      { label: "Scan Job Order", path: "/operator/scan" },
      { label: "My Operations", path: "/operator/my-operations" },
      { label: "Production Entry", path: "/operator/production-entry" },
      { label: "Production History", path: "/operator/history" },
      { label: "My Performance", path: "/operator/performance" },
      { label: "Traceability", path: "/operator/traceability" },
    ],
  },
];

export default function ProductionHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/scanlogs?limit=200");
        setLogs(res.data.logs || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.jobOrder?.jobOrderNo?.toLowerCase().includes(search.toLowerCase()) ||
      l.serialId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">Production History</h1>
      <p className="text-slate-500 text-sm mb-5">Your scan history across all job orders.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Job Order or Serial ID..."
          className="w-full max-w-xs border rounded-lg px-2 py-1.5 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Job Order</th>
              <th className="px-4 py-3">Serial ID</th>
              <th className="px-4 py-3">Operation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">No scans yet.</td></tr>
            ) : (
              filtered.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{log.jobOrder?.jobOrderNo}</td>
                  <td className="px-4 py-3">{log.serialId}</td>
                  <td className="px-4 py-3">{log.operation?.operationName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        log.status === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
