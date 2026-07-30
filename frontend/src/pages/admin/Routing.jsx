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

// Mock dropdown data — later comes from GET /api/items and GET /api/operations
const mockItems = [
  { id: 1, itemCode: "ITM-001", name: "Steel Rod" },
  { id: 2, itemCode: "ITM-002", name: "Bracket Assembly" },
  { id: 3, itemCode: "ITM-003", name: "Finished Motor" },
];

const mockOperations = [
  { id: 1, code: "OP-001", name: "Cutting" },
  { id: 2, code: "OP-002", name: "Welding" },
];

// Mock routings — later comes from GET /api/routings
const initialRoutings = [
  {
    id: 1,
    itemId: 3,
    operations: [
      { operationId: 1, workCenter: "WC-Machine Shop", sequenceNo: 1, standardTime: 15 },
      { operationId: 2, workCenter: "WC-Assembly", sequenceNo: 2, standardTime: 25 },
    ],
  },
];

function itemName(id) {
  const item = mockItems.find((i) => i.id === Number(id));
  return item ? `${item.itemCode} - ${item.name}` : "—";
}

function operationName(id) {
  const op = mockOperations.find((o) => o.id === Number(id));
  return op ? `${op.code} - ${op.name}` : "—";
}

export default function Routing() {
  const [routings, setRoutings] = useState(initialRoutings);
  const [showForm, setShowForm] = useState(false);
  const [editingRouting, setEditingRouting] = useState(null);
  const [form, setForm] = useState({
    itemId: "",
    operations: [{ operationId: "", workCenter: "", sequenceNo: "", standardTime: "" }],
  });

  const openAddForm = () => {
    setEditingRouting(null);
    setForm({ itemId: "", operations: [{ operationId: "", workCenter: "", sequenceNo: "", standardTime: "" }] });
    setShowForm(true);
  };

  const openEditForm = (routing) => {
    setEditingRouting(routing);
    setForm(routing);
    setShowForm(true);
  };

  const updateOperationRow = (index, field, value) => {
    const updatedOps = form.operations.map((op, i) =>
      i === index ? { ...op, [field]: value } : op
    );
    setForm({ ...form, operations: updatedOps });
  };

  const addOperationRow = () => {
    setForm({
      ...form,
      operations: [...form.operations, { operationId: "", workCenter: "", sequenceNo: "", standardTime: "" }],
    });
  };

  const removeOperationRow = (index) => {
    setForm({ ...form, operations: form.operations.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRouting) {
      // Later: PUT /api/routings/:id
      setRoutings(routings.map((r) => (r.id === editingRouting.id ? { ...form, id: editingRouting.id } : r)));
    } else {
      // Later: POST /api/routings
      setRoutings([...routings, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    // Later: DELETE /api/routings/:id
    if (confirm("Delete this routing?")) {
      setRoutings(routings.filter((r) => r.id !== id));
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Routing</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Routing
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Operations (in sequence)</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routings.map((routing) => (
              <tr key={routing.id} className="border-t align-top">
                <td className="px-4 py-3">{itemName(routing.itemId)}</td>
                <td className="px-4 py-3">
                  {routing.operations
                    .slice()
                    .sort((a, b) => a.sequenceNo - b.sequenceNo)
                    .map((op, i) => (
                      <div key={i} className="text-slate-600">
                        {op.sequenceNo}. {operationName(op.operationId)} — {op.workCenter} ({op.standardTime} min)
                      </div>
                    ))}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => openEditForm(routing)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(routing.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingRouting ? "Edit Routing" : "Add Routing"}</h2>

            <label className="block text-sm font-medium mb-1">Item</label>
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">-- Select Item --</option>
              {mockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-2">Operations in Sequence</label>
            <div className="space-y-2 mb-3">
              {form.operations.map((op, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={op.operationId}
                    onChange={(e) => updateOperationRow(index, "operationId", e.target.value)}
                    required
                    className="flex-1 border rounded px-2 py-2 text-sm"
                  >
                    <option value="">-- Operation --</option>
                    {mockOperations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Work Center"
                    value={op.workCenter}
                    onChange={(e) => updateOperationRow(index, "workCenter", e.target.value)}
                    required
                    className="w-32 border rounded px-2 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Seq"
                    value={op.sequenceNo}
                    onChange={(e) => updateOperationRow(index, "sequenceNo", e.target.value)}
                    required
                    className="w-16 border rounded px-2 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Time (min)"
                    value={op.standardTime}
                    onChange={(e) => updateOperationRow(index, "standardTime", e.target.value)}
                    required
                    className="w-24 border rounded px-2 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeOperationRow(index)}
                    disabled={form.operations.length === 1}
                    className="text-red-600 text-sm px-2 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOperationRow}
              className="text-blue-600 text-sm font-medium mb-4"
            >
              + Add Operation
            </button>

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