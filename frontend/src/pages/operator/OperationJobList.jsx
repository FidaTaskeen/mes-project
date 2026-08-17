import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Operator Dashboard", path: "/operator/dashboard" },
      { label: "Scan Job Order", path: "/operator/scan" },
      { label: "My Operations", path: "/operator/my-operations" },
      { label: "Production History", path: "/operator/history" },
      { label: "My Performance", path: "/operator/performance" },
    ],
  },
];

const statusStyle = {
  Planned: "bg-slate-100 text-slate-600",
  Released: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Completed: "bg-green-100 text-green-700",
};

export default function OperationJobList() {
  const { operationId } = useParams();
  const navigate = useNavigate();
  const [jobOrders, setJobOrders] = useState([]);
  const [operationName, setOperationName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, meRes] = await Promise.all([
        axiosInstance.get(`/joborders/by-operation/${operationId}`),
        axiosInstance.get("/auth/me"),
      ]);
      setJobOrders(res.data.jobOrders || []);
      const op = (meRes.data.user.assignedOperations || []).find((o) => o._id === operationId);
      setOperationName(op ? `${op.operationCode} - ${op.operationName}` : "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationId]);

  const filtered = jobOrders.filter(
    (q) =>
      !search ||
      q.jobOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      q.item?.itemCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <button
        onClick={() => navigate("/operator/dashboard")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Dashboard
      </button>

      <h1 className="text-xl font-bold mb-1">{operationName || "Operation"}</h1>
      <p className="text-slate-500 text-sm mb-5">Job orders whose routing includes this operation.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job Order No. / Item No."
            className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Job Order</th>
              <th className="px-4 py-3">Item No. - Description</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-6 text-center text-slate-400">No job orders include this operation.</td></tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.jobOrderId} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-purple-700">{q.jobOrderNo}</td>
                  <td className="px-4 py-3">{q.item?.itemCode} - {q.item?.name}</td>
                  <td className="px-4 py-3">{q.quantity}</td>
                  <td className="px-4 py-3">{q.pending}</td>
                  <td className="px-4 py-3">{q.completed}</td>
                  <td className="px-4 py-3">{q.balance}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusStyle[q.status] || "bg-slate-100 text-slate-600"}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(q.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/operator/scan/${q.jobOrderId}?operation=${operationId}`)}
                      className="text-purple-600 hover:underline"
                    >
                      Scan &gt;
                    </button>
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