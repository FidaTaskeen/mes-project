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
  "-": "bg-slate-100 text-slate-400",
};

export default function OperatorTraceability() {
  const [serialId, setSerialId] = useState("");
  const [jobOrder, setJobOrder] = useState(null);
  const [trace, setTrace] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!serialId.trim()) {
      setError("Enter or scan a serial number to search.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/scanlogs/trace/${serialId.trim()}`);
      setJobOrder(res.data.jobOrder);
      setTrace(res.data.trace || []);
      setHasSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || "No traceability data found for this serial.");
      setJobOrder(null);
      setTrace([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSerialId("");
    setJobOrder(null);
    setTrace([]);
    setHasSearched(false);
    setError("");
  };

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <div className="mb-1 text-sm text-slate-500">
        Dashboard &gt; Traceability &gt; Process Traceability
      </div>
      <h1 className="text-2xl font-bold mb-5">Process Traceability</h1>

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-1">Scan Serial</label>
        <input
          value={serialId}
          onChange={(e) => setSerialId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Enter or scan a serial number"
          autoFocus
          className="w-full max-w-md border rounded-lg px-3 py-2 text-sm mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="bg-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
          >
            Search
          </button>
          <button
            onClick={handleRefresh}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

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
            ) : !hasSearched ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Search a serial number to view its full process trace.</td></tr>
            ) : trace.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">No routing found for this serial.</td></tr>
            ) : (
              trace.map((row, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 font-medium text-purple-700">{jobOrder?.jobOrderNo}</td>
                  <td className="px-4 py-3">{jobOrder?.item?.itemCode}</td>
                  <td className="px-4 py-3 font-medium">{row.operationCode} - {row.operationName}</td>
                  <td className="px-4 py-3">{serialId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusStyle[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {row.dateTime ? new Date(row.dateTime).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">{row.user || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}