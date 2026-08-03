import { useState, useEffect } from "react";
import { Target, CheckCircle2, XCircle, Settings2, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [summary, setSummary] = useState({ todaysTarget: 0, completedQty: 0, rejectQty: 0 });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, summaryRes, queueRes] = await Promise.all([
        axiosInstance.get("/auth/me"),
        axiosInstance.get("/production-entries/today-summary"),
        axiosInstance.get("/joborders/my-queue"),
      ]);
      setAssignedOperations(meRes.data.user.assignedOperations || []);
      setSummary(summaryRes.data.summary);
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

  const cards = [
    { label: "Today's Target", value: summary.todaysTarget, icon: Target, accent: "text-blue-600 bg-blue-50" },
    { label: "Completed Qty", value: summary.completedQty, icon: CheckCircle2, accent: "text-green-600 bg-green-50" },
    { label: "Reject Qty", value: summary.rejectQty, icon: XCircle, accent: "text-red-600 bg-red-50" },
  ];

  const goScan = (jobOrderNo) => {
    navigate("/operator/scan", { state: { jobOrderNo } });
  };

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Operator Dashboard</h1>
        <p className="text-slate-500 text-sm">Your production summary for today.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          {/* My Assigned Operations */}
          <div className="mb-6">
            <h2 className="font-medium mb-2 text-sm text-slate-600">My Assigned Operations</h2>
            {assignedOperations.length === 0 ? (
              <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg">
                No operations assigned yet. Contact your admin.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedOperations.map((op) => (
                  <span
                    key={op._id}
                    className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    <Settings2 size={14} className="text-purple-600" />
                    {op.operationName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Today's stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm border p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.accent}`}>
                  <c.icon size={20} />
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-slate-500 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Job Orders waiting at my station */}
          <div>
            <h2 className="font-medium mb-3">Job Orders Waiting at My Station</h2>
            {queue.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400 text-sm">
                Nothing waiting right now.
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((q) => (
                  <div
                    key={q.jobOrderId}
                    className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Settings2 size={18} />
                      </div>
                      <div>
                        <p className="font-semibold">{q.jobOrderNo}</p>
                        <p className="text-xs text-slate-500">
                          {q.item?.itemCode} - {q.item?.name} • {q.currentOperation?.operationName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Remaining: {q.remainingQuantity} / {q.quantity}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Due {new Date(q.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => goScan(q.jobOrderNo)}
                      className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                    >
                      Scan & Start <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}