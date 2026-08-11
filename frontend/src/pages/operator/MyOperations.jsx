import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings2 } from "lucide-react";
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

export default function MyOperations() {
  const [operations, setOperations] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [meRes, queueRes] = await Promise.all([
          axiosInstance.get("/auth/me"),
          axiosInstance.get("/joborders/my-queue"),
        ]);
        setOperations(meRes.data.user.assignedOperations || []);
        setQueue(queueRes.data.queue || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load operations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const countForOp = (opId) => queue.filter((q) => q.currentOperation?._id === opId).length;

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">My Operations</h1>
      <p className="text-slate-500 text-sm mb-5">Operations assigned to you, and pending job orders at each.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : operations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400 text-sm">
          No operations assigned yet. Contact your admin.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operations.map((op) => (
            <button
              key={op._id}
              onClick={() => navigate(`/operator/operation/${op._id}`)}
              className="bg-white rounded-xl shadow-sm border p-5 text-left hover:border-purple-400 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Settings2 size={20} />
                </div>
                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {countForOp(op._id)} pending
                </span>
              </div>
              <p className="font-semibold">{op.operationCode}</p>
              <p className="text-sm text-slate-500">{op.operationName}</p>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}