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

// Mock data — later comes from whichever job order was scanned
const currentJobOrder = {
  jobOrderNo: "JO-000124",
  currentOperation: "Welding",
  nextOperation: "Painting",
  sequence: [
    { seq: 1, operation: "Cutting", status: "Completed" },
    { seq: 2, operation: "Welding", status: "InProgress" },
    { seq: 3, operation: "Painting", status: "Pending" },
    { seq: 4, operation: "Quality Check", status: "Pending" },
  ],
  workInstructions: "Ensure weld joints are inspected before moving to painting. Use standard voltage settings for Bracket Assembly (see SOP-014).",
};

const statusColors = {
  Completed: "bg-green-100 text-green-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Pending: "bg-slate-200 text-slate-500",
};

export default function MyOperations() {
  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">My Operations</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs text-slate-400 mb-1">Current Operation</p>
          <p className="text-lg font-bold text-purple-700">{currentJobOrder.currentOperation}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-xs text-slate-400 mb-1">Next Operation</p>
          <p className="text-lg font-bold">{currentJobOrder.nextOperation}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-medium mb-3">Operation Sequence</h2>
        <div className="space-y-2">
          {currentJobOrder.sequence.map((step) => (
            <div key={step.seq} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
              <span>{step.seq}. {step.operation}</span>
              <span className={`px-2 py-1 rounded text-xs ${statusColors[step.status]}`}>
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-medium mb-2">Work Instructions / Notes</h2>
        <p className="text-sm text-slate-600">{currentJobOrder.workInstructions}</p>
      </div>
    </Layout>
  );
}