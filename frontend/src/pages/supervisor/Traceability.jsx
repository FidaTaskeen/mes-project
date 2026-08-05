import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Job Order", path: "/supervisor/job-order-list" },
      { label: "Traceability", path: "/supervisor/traceability" },
    ],
  },
];

export default function Traceability() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobOrderNo, setJobOrderNo] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/scanlogs?status=Fail&limit=200");
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load traceability data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter(
    (l) => !jobOrderNo || l.jobOrder?.jobOrderNo?.toLowerCase().includes(jobOrderNo.toLowerCase())
  );

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">Traceability</h1>
      <p className="text-slate-500 text-sm mb-5">Rejected / failed scans across all job orders.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">Job Order No.</label>
        <input
          value={jobOrderNo}
          onChange={(e) => setJobOrderNo(e.target.value)}
          placeholder="Filter by job order..."
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
              <th className="px-4 py-3">Scanned By</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">No rejected scans found.</td></tr>
            ) : (
              filtered.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{log.jobOrder?.jobOrderNo}</td>
                  <td className="px-4 py-3">{log.serialId}</td>
                  <td className="px-4 py-3">{log.operation?.operationName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Fail</span>
                  </td>
                  <td className="px-4 py-3">{log.scannedBy?.name || "—"}</td>
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