import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pencil, Eye } from "lucide-react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Rework Dashboard", path: "/rework/dashboard" },
      { label: "TRC In & Out", path: "/rework/trc" },
    ],
  },
];

const statusBadge = {
  Pending: "bg-slate-200 text-slate-600",
  CheckedIn: "bg-blue-100 text-blue-700",
  CheckedOut: "bg-green-100 text-green-700",
};

const agingDays = (dateStr) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return `${days}d`;
};

export default function TrcList() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({ date: "", jobOrder: "", serialId: "" });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set("date", filters.date);
      if (filters.serialId) params.set("serialId", filters.serialId);
      const res = await axiosInstance.get(`/trc?${params.toString()}`);
      setRecords(res.data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load TRC queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout portalName="Rework Portal" theme="amber" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">TRC In & Out</h1>
      <p className="text-slate-500 text-sm mb-5">Scan NG board to verify and track In/Out of TRC</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Job Order</label>
            <input
              value={filters.jobOrder}
              onChange={(e) => setFilters({ ...filters, jobOrder: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Serial ID</label>
            <input
              value={filters.serialId}
              onChange={(e) => setFilters({ ...filters, serialId: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ date: "", jobOrder: "", serialId: "" });
              loadData();
            }}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aging</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Job Order</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item No. - Description</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Serial ID</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Operation</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan="8" className="px-4 py-6 text-center text-slate-400">No TRC records found.</td></tr>
            ) : (
              records
                .filter((r) => !filters.jobOrder || r.jobOrder?.jobOrderNo?.toLowerCase().includes(filters.jobOrder.toLowerCase()))
                .map((r) => (
                  <tr key={r._id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/rework/trc/${r._id}`} className="text-amber-600 hover:text-amber-800" title="Open">
                        {r.status === "Pending" ? <Pencil size={14} /> : <Eye size={14} />}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{agingDays(r.failedAt)}</td>
                    <td className="px-4 py-3">{new Date(r.failedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-amber-700">{r.jobOrder?.jobOrderNo}</td>
                    <td className="px-4 py-3">{r.item?.itemCode} - {r.item?.name}</td>
                    <td className="px-4 py-3">{r.serialId}</td>
                    <td className="px-4 py-3">{r.operation?.operationCode} - {r.operation?.operationName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusBadge[r.status]}`}>{r.status}</span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}