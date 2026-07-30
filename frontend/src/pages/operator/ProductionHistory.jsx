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

// Mock data — later comes from GET /api/production-entries?operator=me
const entries = [
  { id: 1, time: "09:15 AM", jobOrderNo: "JO-000123", operation: "Cutting", goodQty: 45, rejectQty: 2 },
  { id: 2, time: "10:40 AM", jobOrderNo: "JO-000123", operation: "Cutting", goodQty: 38, rejectQty: 1 },
  { id: 3, time: "01:20 PM", jobOrderNo: "JO-000124", operation: "Welding", goodQty: 52, rejectQty: 3 },
];

export default function ProductionHistory() {
  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Production History</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Job Order No.</th>
              <th className="px-4 py-3">Operation</th>
              <th className="px-4 py-3">Good Qty</th>
              <th className="px-4 py-3">Reject Qty</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="px-4 py-3">{entry.time}</td>
                <td className="px-4 py-3">{entry.jobOrderNo}</td>
                <td className="px-4 py-3">{entry.operation}</td>
                <td className="px-4 py-3 text-green-700">{entry.goodQty}</td>
                <td className="px-4 py-3 text-red-600">{entry.rejectQty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}