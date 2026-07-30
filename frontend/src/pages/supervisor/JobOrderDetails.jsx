import { useParams, Link } from "react-router-dom";
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

// Mock data — later replaced by GET /api/job-orders/:jobOrderNo
const mockDetails = {
  jobOrderNo: "JO-000123",
  item: "Steel Rod",
  itemCode: "ITM-001",
  totalQuantity: 500,
  completedQuantity: 320,
  status: "InProgress",
  startDate: "2026-07-25",
  dueDate: "2026-08-05",
  routingSteps: [
    { seq: 1, operation: "Cutting", workCenter: "WC-Machine Shop", status: "Completed" },
    { seq: 2, operation: "Welding", workCenter: "WC-Assembly", status: "InProgress" },
    { seq: 3, operation: "Painting", workCenter: "WC-Finishing", status: "Pending" },
    { seq: 4, operation: "Quality Check", workCenter: "WC-QC", status: "Pending" },
  ],
};

const stepStatusColors = {
  Completed: "bg-green-100 text-green-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Pending: "bg-slate-200 text-slate-500",
};

export default function JobOrderDetails() {
  const { jobOrderNo } = useParams();
  // Later: fetch real data using jobOrderNo → GET /api/job-orders/{jobOrderNo}
  const details = mockDetails;

  const progressPercent = Math.round((details.completedQuantity / details.totalQuantity) * 100);

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <Link to="/supervisor/job-order-list" className="text-sm text-green-700 hover:underline">
        ← Back to Job Order List
      </Link>

      <h1 className="text-2xl font-bold mt-2 mb-6">Job Order: {jobOrderNo}</h1>

      {/* Summary card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs text-slate-400">Item</p>
          <p className="font-medium">{details.item} ({details.itemCode})</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Quantity</p>
          <p className="font-medium">{details.totalQuantity}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Completed Quantity</p>
          <p className="font-medium">{details.completedQuantity}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Status</p>
          <p className="font-medium">{details.status}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Start Date</p>
          <p className="font-medium">{details.startDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Due Date</p>
          <p className="font-medium">{details.dueDate}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Routing steps table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">Routing Steps</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Sequence</th>
              <th className="px-4 py-3">Operation</th>
              <th className="px-4 py-3">Work Center</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {details.routingSteps.map((step) => (
              <tr key={step.seq} className="border-t">
                <td className="px-4 py-3">{step.seq}</td>
                <td className="px-4 py-3">{step.operation}</td>
                <td className="px-4 py-3">{step.workCenter}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${stepStatusColors[step.status]}`}>
                    {step.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}