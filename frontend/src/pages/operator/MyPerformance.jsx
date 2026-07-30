import Layout from "../../components/Layout";

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

// Mock data — later comes from aggregate GET /api/production-entries?operator=me
const performance = {
  dailyPerformance: 87,
  totalGoodQty: 135,
  totalRejectQty: 6,
  efficiency: 96,
};

function StatCard({ label, value, suffix = "" }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-purple-700">{value}{suffix}</p>
    </div>
  );
}

export default function MyPerformance() {
  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">My Performance</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Daily Performance" value={performance.dailyPerformance} suffix="%" />
        <StatCard label="Total Good Qty" value={performance.totalGoodQty} />
        <StatCard label="Total Reject Qty" value={performance.totalRejectQty} />
        <StatCard label="Efficiency" value={performance.efficiency} suffix="%" />
      </div>
    </Layout>
  );
}