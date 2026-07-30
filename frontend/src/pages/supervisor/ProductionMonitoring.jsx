import Layout from "../../components/Layout";

const navGroups = [
  {
    items: [
      { label: "Supervisor Dashboard", path: "/supervisor/dashboard" },
      { label: "Create Job Order", path: "/supervisor/create-job-order" },
      { label: "Job Order List", path: "/supervisor/job-order-list" },
      { label: "Production Monitoring", path: "/supervisor/monitoring" },
      { label: "Reports", path: "/supervisor/reports" },
    ],
  },
];

// Mock data — later replaced by aggregate queries via GET /api/production/monitoring
const jobOrderProgress = [
  { jobOrderNo: "JO-000123", item: "Steel Rod", percent: 64 },
  { jobOrderNo: "JO-000124", item: "Bracket Assembly", percent: 20 },
  { jobOrderNo: "JO-000125", item: "Finished Motor", percent: 100 },
];

const workCenterProgress = [
  { workCenter: "WC-Machine Shop", completed: 420, target: 500 },
  { workCenter: "WC-Assembly", completed: 180, target: 300 },
  { workCenter: "WC-Finishing", completed: 90, target: 150 },
];

const operatorProgress = [
  { operator: "Ravi Kumar", goodQty: 120, rejectQty: 4 },
  { operator: "Suresh N", goodQty: 95, rejectQty: 2 },
  { operator: "Manju P", goodQty: 140, rejectQty: 6 },
];

function ProgressBar({ percent, colorClass = "bg-green-600" }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5">
      <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function ProductionMonitoring() {
  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Production Monitoring</h1>

      {/* Job Order Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-medium mb-4">Job Order Progress</h2>
        <div className="space-y-4">
          {jobOrderProgress.map((jo) => (
            <div key={jo.jobOrderNo}>
              <div className="flex justify-between text-sm mb-1">
                <span>{jo.jobOrderNo} — {jo.item}</span>
                <span>{jo.percent}%</span>
              </div>
              <ProgressBar percent={jo.percent} />
            </div>
          ))}
        </div>
      </div>

      {/* Work Center Wise Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-medium mb-4">Work Center Wise Progress</h2>
        <div className="space-y-4">
          {workCenterProgress.map((wc) => {
            const percent = Math.round((wc.completed / wc.target) * 100);
            return (
              <div key={wc.workCenter}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{wc.workCenter}</span>
                  <span>{wc.completed} / {wc.target}</span>
                </div>
                <ProgressBar percent={percent} colorClass="bg-blue-600" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Manpower / Operator Wise Progress */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">Operator Wise Progress</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Good Qty</th>
              <th className="px-4 py-3">Reject Qty</th>
              <th className="px-4 py-3">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {operatorProgress.map((op) => {
              const total = op.goodQty + op.rejectQty;
              const efficiency = total > 0 ? Math.round((op.goodQty / total) * 100) : 0;
              return (
                <tr key={op.operator} className="border-t">
                  <td className="px-4 py-3">{op.operator}</td>
                  <td className="px-4 py-3 text-green-700">{op.goodQty}</td>
                  <td className="px-4 py-3 text-red-600">{op.rejectQty}</td>
                  <td className="px-4 py-3">{efficiency}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}