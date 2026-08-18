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

const stationStatusStyle = {
  Completed: "bg-green-100 text-green-700",
  InProgress: "bg-blue-100 text-blue-700",
  Open: "bg-slate-200 text-slate-500",
};

export default function OperationJobList() {
  const { operationId } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [operationName, setOperationName] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/joborders/operation-queue/${operationId}`);
      const data = res.data.queue || [];
      setQueue(data);
      if (data.length > 0) {
        setOperationName(`${data[0].operation.operationCode} - ${data[0].operation.operationName}`);
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

  const filtered = queue.filter((q) => {
    const matchesSearch =
      !search ||
      q.jobOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      q.item?.itemCode?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || q.jobOrderStatus === status;
    return matchesSearch && matchesStatus;
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
      <p className="text-slate-500 text-sm mb-5">All job orders whose routing includes this operation.</p>

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
            <option value="On Hold">On Hold</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
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
              <th className="px-4 py-3">Produced</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">JO Status</th>
              <th className="px-4 py-3">Station Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="10" className="px-4 py-6 text-center text-slate-400">No job orders found for this operation.</td></tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.jobOrderId} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-purple-700">{q.jobOrderNo}</td>
                  <td className="px-4 py-3">{q.item?.itemCode} - {q.item?.name}</td>
                  <td className="px-4 py-3">{q.quantity}</td>
                  <td className="px-4 py-3">{q.producedQuantity}</td>
                  <td className="px-4 py-3">{q.pendingQuantity}</td>
                  <td className="px-4 py-3">{q.balanceQuantity}</td>
                  <td className="px-4 py-3">{new Date(q.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{q.jobOrderStatus}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${stationStatusStyle[q.stationStatus]}`}>
                      {q.stationStatus}
                    </span>
                  </td>
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