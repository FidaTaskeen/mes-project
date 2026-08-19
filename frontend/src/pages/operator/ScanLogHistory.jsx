import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

export default function ScanLogHistory() {
  const { jobOrderNo } = useParams();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = async (p) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/scan-logs", {
        params: { jobOrderNo, page: p, limit: 100 },
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <Link to="/operator/scan" className="text-sm text-purple-600 hover:underline flex items-center gap-1 mb-4">
        <ArrowLeft size={14} /> Back to Scan
      </Link>
      <h1 className="text-2xl font-bold mb-1">Scan Log — {jobOrderNo}</h1>
      <p className="text-sm text-slate-500 mb-6">{total} total scans</p>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">No scans found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-500 text-xs">
                <th className="p-3">Serial ID</th>
                <th className="p-3">Time</th>
                <th className="p-3">Status</th>
                <th className="p-3">Scanned By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-t">
                  <td className="p-3">{log.serialId}</td>
                  <td className="p-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={log.status === "Pass" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{log.scannedBy?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </Layout>
  );
}
