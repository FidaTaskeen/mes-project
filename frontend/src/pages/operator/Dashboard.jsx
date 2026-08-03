import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
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

export default function OperatorDashboard() {
  const [assignedOperations, setAssignedOperations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, queueRes] = await Promise.all([
        axiosInstance.get("/auth/me"),
        axiosInstance.get("/joborders/my-queue"),
      ]);
      setAssignedOperations(meRes.data.user.assignedOperations || []);
      setQueue(queueRes.data.queue || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOps = assignedOperations.filter((op) => {
    if (!op || typeof op !== "object") return false;
    const name = (op.operationName || "").toLowerCase();
    const code = (op.operationCode || "").toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const activeOrders = queue.length;
  const holdOrders = queue.filter((q) => {
    const overdue = new Date(q.dueDate) < new Date();
    return overdue;
  }).length;

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: search + operation tiles */}
        <div className="lg:col-span-2">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Operation"
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white"
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : filteredOps.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400 text-sm">
              No operations assigned yet. Contact your admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredOps.map((op) => (
                <div key={op._id} className="bg-white rounded-xl shadow-sm border p-5">
                  <p className="font-semibold text-slate-800">{op.operationCode}</p>
                  <p className="text-xs text-slate-500 mb-3">({op.operationName})</p>
                  <button
                    onClick={() => navigate(`/operator/operation/${op._id}`)}
                    className="text-purple-600 text-sm font-medium hover:underline"
                  >
                    View Details &gt;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: stats + alerts */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-2xl font-bold">{assignedOperations.length}</p>
              <p className="text-xs text-slate-500 mt-1">Assigned Ops</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-2xl font-bold">{activeOrders}</p>
              <p className="text-xs text-slate-500 mt-1">Active Orders</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center col-span-2">
              <p className="text-2xl font-bold">{holdOrders}</p>
              <p className="text-xs text-slate-500 mt-1">Overdue Orders</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
              <Bell size={16} />
              <span className="font-medium text-sm">Alerts</span>
            </div>
            <div className="p-4 text-sm text-slate-400 text-center">No alerts right now.</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}