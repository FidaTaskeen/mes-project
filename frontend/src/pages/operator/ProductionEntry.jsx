import { useState } from "react";
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
      { label: "Traceability", path: "/operator/traceability" },
    ],
  },
];

export default function ProductionEntry() {
  const [form, setForm] = useState({ goodQty: "", rejectQty: "", remarks: "" });
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Later: POST /api/production-entries
    console.log("New production entry:", form);
    setSuccessMsg("Production entry submitted successfully!");
    setForm({ goodQty: "", rejectQty: "", remarks: "" });
  };

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Production Entry</h1>

      {successMsg && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded mb-4">{successMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Good Quantity</label>
          <input
            type="number"
            value={form.goodQty}
            onChange={(e) => setForm({ ...form, goodQty: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reject Quantity</label>
          <input
            type="number"
            value={form.rejectQty}
            onChange={(e) => setForm({ ...form, rejectQty: e.target.value })}
            required
            className="w-full border rounded px-3 py-2"
          />
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

        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700">
          Submit
        </button>
      </form>
    </Layout>
  );
}
