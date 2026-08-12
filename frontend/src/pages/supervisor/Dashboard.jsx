import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Search, Bell, AlertTriangle } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Job Order", path: "/supervisor/job-order-list" },
      { label: "Traceability", path: "/supervisor/traceability" },
    ],
  },
];

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLines: 0, activeOrders: 0, holdOrders: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/joborders?limit=200");
      const jobOrders = res.data.jobOrders || [];

      const inProgress = jobOrders.filter((jo) => jo.status === "In Progress");
      const onHold = jobOrders.filter((jo) => jo.status === "On Hold");
      const activeRoutingCodes = new Set(
        inProgress.map((jo) => jo.routing?.routingCode).filter(Boolean)
      );

      setStats({
        activeLines: activeRoutingCodes.size,
        activeOrders: inProgress.length,
        holdOrders: onHold.length,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdue = jobOrders.filter(
        (jo) => jo.status !== "Completed" && new Date(jo.dueDate) < today
      );
      setAlerts(
        overdue.map((jo) => ({
          id: jo._id,
          message: `${jo.jobOrderNo} is overdue (due ${new Date(jo.dueDate).toLocaleDateString()})`,
        }))
      );
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Supervisor Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: module cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <button
            onClick={() => navigate("/supervisor/job-order-list")}
            className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center gap-3 hover:border-green-400 hover:shadow-md transition text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <ClipboardList size={22} />
            </div>
            <span className="font-medium">Job Order</span>
            <span className="text-xs text-slate-400">Create and manage job orders</span>
          </button>
          <button
            onClick={() => navigate("/supervisor/traceability")}
            className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center gap-3 hover:border-green-400 hover:shadow-md transition text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Search size={22} />
            </div>
            <span className="font-medium">Traceability</span>
            <span className="text-xs text-slate-400">View rejected / failed scans</span>
          </button>
        </div>

        {/* Right: stats + alerts */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Active Lines</div>
              <div className="text-2xl font-bold text-slate-800">
                {loading ? "…" : stats.activeLines}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Active Orders</div>
              <div className="text-2xl font-bold text-slate-800">
                {loading ? "…" : stats.activeOrders}
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="text-xs text-slate-400 mb-1">Hold Orders</div>
              <div className="text-2xl font-bold text-slate-800">
                {loading ? "…" : stats.holdOrders}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
              <Bell size={14} /> Alerts
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-slate-400 text-sm">Loading...</div>
              ) : alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-400 text-sm">No alerts right now.</div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 px-4 py-3 border-t text-sm text-slate-700"
                  >
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    {alert.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}