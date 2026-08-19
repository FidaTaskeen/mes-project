import { useState } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Operator Dashboard", path: "/operator/dashboard" },
      { label: "Scan Job Order", path: "/operator/scan" },
      { label: "Traceability", path: "/operator/traceability" },
      { label: "My Operations", path: "/operator/my-operations" },
      { label: "Production Entry", path: "/operator/production-entry" },
      { label: "Production History", path: "/operator/history" },
      { label: "My Performance", path: "/operator/performance" },
    ],
  },
];

const statusStyle = {
  Pass: "bg-green-100 text-green-700",
  Fail: "bg-red-100 text-red-700",
};

export default function OperatorTraceability() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serialId, setSerialId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const loadData = async () => {
    if (!serialId.trim()) {
      setError("Enter or scan a serial number to search.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100", serialId: serialId.trim(), sort: "asc" });
      const res = await axiosInstance.get(`/scanlogs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load traceability data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSerialId("");
    setLogs([]);
    setTotal(0);
    setHasSearched(false);
    setError("");
  };

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <div className="text-sm text-slate-500 mb-1">Dashboard &gt; Traceability &gt; Process Traceability</div>
      <h1 className="text-2xl font-bold mb-5">Process Traceability</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Scan Serial</label>
            <input
              value={serialId}
              onChange={(e) => setSerialId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData()}
              placeholder="Scan or type a serial number..."
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
            Search
          </button>
          <button onClick={handleRefresh} className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600">
            Refresh
          </button>
        </div>
      </div>

      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Job Order</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item No.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Operation</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Serial ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date &amp; Time</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">No scans found for this serial.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-t">
                    <td className="px-4 py-3 font-medium text-purple-700">{log.jobOrder?.jobOrderNo}</td>
                    <td className="px-4 py-3">{log.jobOrder?.item?.itemCode}</td>
                    <td className="px-4 py-3">{log.operation?.operationCode} - {log.operation?.operationName}</td>
                    <td className="px-4 py-3">{log.serialId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${statusStyle[log.status] || "bg-slate-100 text-slate-500"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{log.scannedBy?.name || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && logs.length > 0 && (
            <div className="px-4 py-3 border-t text-xs text-slate-400">
              Items per page: 100 · Showing {logs.length} of {total}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}