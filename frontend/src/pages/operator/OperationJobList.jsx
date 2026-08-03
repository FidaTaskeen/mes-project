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
      { label: "Production Entry", path: "/operator/production-entry" },
      { label: "Production History", path: "/operator/history" },
      { label: "My Performance", path: "/operator/performance" },
    ],
  },
];

export default function OperationJobList() {
  const { operationId } = useParams();
  const navigate = useNavigate();
  const [allQueue, setAllQueue] = useState([]);
  const [operationName, setOperationName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/joborders/my-queue");
      const queue = res.data.queue || [];
      const forThisOp = queue.filter((q) => q.currentOperation?._id === operationId);
      setAllQueue(forThisOp);
      if (forThisOp.length > 0) {
        setOperationName(forThisOp[0].currentOperation.operationName);
      }
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

  const filtered = allQueue.filter((q) => {
    const matchesSearch =
      !search ||
      q.jobOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      q.item?.itemCode?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <button
        onClick={() => navigate("/operator/dashboard")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700"
      >
        <ArrowLeft size={14} /> Dashboard
      </button>

      <h1 className="text-xl font-bold mb-1">{operationName || "Operation"}</h1>
      <p className="text-slate-500 text-sm mb-5">Job orders currently at this operation.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Job Order No. / Item No."
              className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="Planned">Planned</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Job Order</th>
              <th className="px-4 py-3">Item No. - Description</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">No job orders waiting here.</td></tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.jobOrderId} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-purple-700">{q.jobOrderNo}</td>
                  <td className="px-4 py-3">{q.item?.itemCode} - {q.item?.name}</td>
                  <td className="px-4 py-3">{q.quantity}</td>
                  <td className="px-4 py-3">{q.remainingQuantity}</td>
                  <td className="px-4 py-3">{new Date(q.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/operator/scan/${q.jobOrderId}`)}
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