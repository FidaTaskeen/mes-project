import { useState } from "react";
import Layout from "../../components/Layout";

const navGroups = [
  { items: [{ label: "Admin Dashboard", path: "/admin/dashboard" }] },
  {
    title: "MASTER DATA",
    items: [
      { label: "Items", path: "/admin/items" },
      { label: "Operations", path: "/admin/operations" },
      { label: "BOM", path: "/admin/bom" },
      { label: "Routing", path: "/admin/routing" },
      { label: "Users", path: "/admin/users" },
    ],
  },
];

// Mock data — later replaced by GET /api/operations
const initialOperations = [
  { id: 1, operationCode: "OP-001", name: "Cutting", workCenter: "WC-Machine Shop", standardTime: 15, sequenceOrder: 1 },
  { id: 2, operationCode: "OP-002", name: "Welding", workCenter: "WC-Assembly", standardTime: 25, sequenceOrder: 2 },
];

export default function AdminOperations() {
  const [operations, setOperations] = useState(initialOperations);
  const [showForm, setShowForm] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [form, setForm] = useState({
    operationCode: "",
    name: "",
    workCenter: "",
    standardTime: "",
    sequenceOrder: "",
  });

  const openAddForm = () => {
    setEditingOp(null);
    setForm({ operationCode: "", name: "", workCenter: "", standardTime: "", sequenceOrder: "" });
    setShowForm(true);
  };

  const openEditForm = (op) => {
    setEditingOp(op);
    setForm(op);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOp) {
      // Later: PUT /api/operations/:id
      setOperations(operations.map((o) => (o.id === editingOp.id ? { ...form, id: editingOp.id } : o)));
    } else {
      // Later: POST /api/operations
      setOperations([...operations, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    // Later: DELETE /api/operations/:id
    if (confirm("Delete this operation?")) {
      setOperations(operations.filter((o) => o.id !== id));
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Operations</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Operation
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Operation Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Work Center</th>
              <th className="px-4 py-3">Standard Time (min)</th>
              <th className="px-4 py-3">Sequence</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-t">
                <td className="px-4 py-3">{op.operationCode}</td>
                <td className="px-4 py-3">{op.name}</td>
                <td className="px-4 py-3">{op.workCenter}</td>
                <td className="px-4 py-3">{op.standardTime}</td>
                <td className="px-4 py-3">{op.sequenceOrder}</td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => openEditForm(op)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(op.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingOp ? "Edit Operation" : "Add Operation"}</h2>

            <label className="block text-sm font-medium mb-1">Operation Code</label>
            <input
              value={form.operationCode}
              onChange={(e) => setForm({ ...form, operationCode: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Work Center</label>
            <input
              value={form.workCenter}
              onChange={(e) => setForm({ ...form, workCenter: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Standard Time (minutes)</label>
            <input
              type="number"
              value={form.standardTime}
              onChange={(e) => setForm({ ...form, standardTime: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Sequence Order</label>
            <input
              type="number"
              value={form.sequenceOrder}
              onChange={(e) => setForm({ ...form, sequenceOrder: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}