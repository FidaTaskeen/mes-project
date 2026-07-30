import { useState } from "react";
import { Link } from "react-router-dom";
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

// Mock data — later replaced by GET /api/job-orders
const mockJobOrders = [
  { id: 1, jobOrderNo: "JO-000123", item: "Steel Rod", quantity: 500, startDate: "2026-07-25", dueDate: "2026-08-05", status: "InProgress" },
  { id: 2, jobOrderNo: "JO-000124", item: "Bracket Assembly", quantity: 200, startDate: "2026-07-26", dueDate: "2026-08-02", status: "Planned" },
  { id: 3, jobOrderNo: "JO-000125", item: "Finished Motor", quantity: 50, startDate: "2026-07-20", dueDate: "2026-07-28", status: "Completed" },
];

const statusColors = {
  Planned: "bg-slate-200 text-slate-600",
  Released: "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
};

export default function JobOrderList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredOrders = mockJobOrders.filter((jo) => {
    const matchesSearch =
      jo.jobOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      jo.item.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || jo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Job Order List</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by Job Order No. or Item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Planned">Planned</option>
          <option value="Released">Released</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Job Order No.</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((jo) => (
              <tr key={jo.id} className="border-t">
                <td className="px-4 py-3 font-medium">{jo.jobOrderNo}</td>
                <td className="px-4 py-3">{jo.item}</td>
                <td className="px-4 py-3">{jo.quantity}</td>
                <td className="px-4 py-3">{jo.startDate}</td>
                <td className="px-4 py-3">{jo.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[jo.status]}`}>
                    {jo.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/supervisor/job-order-details/${jo.jobOrderNo}`} className="text-blue-600 hover:underline">
  View
</Link>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No job orders match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}