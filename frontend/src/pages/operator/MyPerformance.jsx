import { useState, useEffect } from "react";
import { Layers, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
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

export default function MyPerformance() {
  const [stats, setStats] = useState({ totalScans: 0, passCount: 0, failCount: 0, passRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get("/scanlogs/my-stats");
        setStats(res.data.stats);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load performance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: "Total Scans", value: stats.totalScans, icon: Layers, accent: "text-blue-600 bg-blue-50" },
    { label: "Passed", value: stats.passCount, icon: CheckCircle2, accent: "text-green-600 bg-green-50" },
    { label: "Failed", value: stats.failCount, icon: XCircle, accent: "text-red-600 bg-red-50" },
    { label: "Pass Rate", value: `${stats.passRate}%`, icon: TrendingUp, accent: "text-purple-600 bg-purple-50" },
  ];

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">My Performance</h1>
      <p className="text-slate-500 text-sm mb-5">Your overall scanning stats.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      )}
    </Layout>
  );
}