import { useState } from "react";
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

// Mock data — later replaced by GET /api/reports?range=daily|weekly|monthly
const mockReport = [
  { date: "2026-07-28", jobOrdersCompleted: 3, goodQty: 620, rejectQty: 18 },
  { date: "2026-07-29", jobOrdersCompleted: 2, goodQty: 410, rejectQty: 9 },
  { date: "2026-07-30", jobOrdersCompleted: 4, goodQty: 780, rejectQty: 22 },
];

export default function Reports() {
  const [range, setRange] = useState("Daily");

  const handleExport = (type) => {
    // Later: call backend export endpoint, or generate client-side with xlsx/jspdf
    alert(`Export to ${type} will be available once connected to the backend.`);
  };

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport("Excel")} className="border px-4 py-2 rounded text-sm hover:bg-slate-50">
            Export to Excel
          </button>
          <button onClick={() => handleExport("PDF")} className="border px-4 py-2 rounded text-sm hover:bg-slate-50">
            Export to PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {["Daily", "Weekly", "Monthly"].map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded text-sm ${
              range === r ? "bg-green-600 text-white" : "bg-white border text-slate-600"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Job Orders Completed</th>
              <th className="px-4 py-3">Total Good Qty</th>
              <th className="px-4 py-3">Total Reject Qty</th>
            </tr>
          </thead>
          <tbody>
            {mockReport.map((row) => (
              <tr key={row.date} className="border-t">
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.jobOrdersCompleted}</td>
                <td className="px-4 py-3 text-green-700">{row.goodQty}</td>
                <td className="px-4 py-3 text-red-600">{row.rejectQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}