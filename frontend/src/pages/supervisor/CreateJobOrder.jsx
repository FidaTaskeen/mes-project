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

// Mock dropdown data — later this comes from GET /api/items and GET /api/routings
const mockItems = [
  { id: 1, itemCode: "ITM-001", name: "Steel Rod" },
  { id: 2, itemCode: "ITM-002", name: "Bracket Assembly" },
  { id: 3, itemCode: "ITM-003", name: "Finished Motor" },
];

const mockRoutings = [
  { id: 1, name: "Routing A - Standard" },
  { id: 2, name: "Routing B - Express" },
];

export default function CreateJobOrder() {
  const [form, setForm] = useState({
    jobOrderNo: `JO-${Date.now().toString().slice(-6)}`, // auto-generated
    itemId: "",
    quantity: "",
    startDate: "",
    dueDate: "",
    routingId: "",
    remarks: "",
    status: "Planned",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later: POST /api/job-orders with this form data
    console.log("New Job Order:", form);
    setSuccessMsg(`Job Order ${form.jobOrderNo} created successfully!`);

    // Reset form with a new auto-generated Job Order No.
    setForm({
      jobOrderNo: `JO-${Date.now().toString().slice(-6)}`,
      itemId: "",
      quantity: "",
      startDate: "",
      dueDate: "",
      routingId: "",
      remarks: "",
      status: "Planned",
    });
  };

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Create Job Order</h1>

      {successMsg && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{successMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Order No. (Auto-generated)</label>
          <input
            value={form.jobOrderNo}
            readOnly
            className="w-full border rounded px-3 py-2 bg-slate-50 text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Select Item</label>
          <select
            value={form.itemId}
            onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select Item --</option>
            {mockItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemCode} - {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Select Routing</label>
          <select
            value={form.routingId}
            onChange={(e) => setForm({ ...form, routingId: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select Routing --</option>
            {mockRoutings.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Remarks (Optional)</label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="Planned">Planned</option>
            <option value="Released">Released</option>
          </select>
        </div>

        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700">
          Create Job Order
        </button>
      </form>
    </Layout>
  );
}    