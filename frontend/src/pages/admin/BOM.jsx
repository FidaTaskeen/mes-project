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

// Mock item list for the dropdowns — later comes from GET /api/items
const mockItems = [
  { id: 1, itemCode: "ITM-001", name: "Steel Rod" },
  { id: 2, itemCode: "ITM-002", name: "Bracket Assembly" },
  { id: 3, itemCode: "ITM-003", name: "Finished Motor" },
];

// Mock BOM list — later comes from GET /api/boms
const initialBoms = [
  {
    id: 1,
    parentItemId: 3,
    version: "v1.0",
    components: [
      { itemId: 1, quantity: 4, unit: "kg" },
      { itemId: 2, quantity: 2, unit: "pcs" },
    ],
  },
];

function itemName(id) {
  const item = mockItems.find((i) => i.id === Number(id));
  return item ? `${item.itemCode} - ${item.name}` : "—";
}

export default function BOM() {
  const [boms, setBoms] = useState(initialBoms);
  const [showForm, setShowForm] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [form, setForm] = useState({
    parentItemId: "",
    version: "",
    components: [{ itemId: "", quantity: "", unit: "" }],
  });

  const openAddForm = () => {
    setEditingBom(null);
    setForm({ parentItemId: "", version: "", components: [{ itemId: "", quantity: "", unit: "" }] });
    setShowForm(true);
  };

  const openEditForm = (bom) => {
    setEditingBom(bom);
    setForm(bom);
    setShowForm(true);
  };

  // Updates ONE field of ONE component row, identified by its index in the array
  const updateComponentRow = (index, field, value) => {
    const updatedComponents = form.components.map((comp, i) =>
      i === index ? { ...comp, [field]: value } : comp
    );
    setForm({ ...form, components: updatedComponents });
  };

  const addComponentRow = () => {
    setForm({ ...form, components: [...form.components, { itemId: "", quantity: "", unit: "" }] });
  };

  const removeComponentRow = (index) => {
    setForm({ ...form, components: form.components.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBom) {
      // Later: PUT /api/boms/:id
      setBoms(boms.map((b) => (b.id === editingBom.id ? { ...form, id: editingBom.id } : b)));
    } else {
      // Later: POST /api/boms
      setBoms([...boms, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    // Later: DELETE /api/boms/:id
    if (confirm("Delete this BOM?")) {
      setBoms(boms.filter((b) => b.id !== id));
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bill of Materials (BOM)</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add BOM
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Parent Item</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Components</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boms.map((bom) => (
              <tr key={bom.id} className="border-t align-top">
                <td className="px-4 py-3">{itemName(bom.parentItemId)}</td>
                <td className="px-4 py-3">{bom.version}</td>
                <td className="px-4 py-3">
                  {bom.components.map((c, i) => (
                    <div key={i} className="text-slate-600">
                      {itemName(c.itemId)} — {c.quantity} {c.unit}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => openEditForm(bom)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(bom.id)} className="text-red-600 hover:underline">
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
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingBom ? "Edit BOM" : "Add BOM"}</h2>

            <label className="block text-sm font-medium mb-1">Parent Item</label>
            <select
              value={form.parentItemId}
              onChange={(e) => setForm({ ...form, parentItemId: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="">-- Select Item --</option>
              {mockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemCode} - {item.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-1">BOM Version</label>
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              placeholder="e.g. v1.0"
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-2">Components</label>
            <div className="space-y-2 mb-3">
              {form.components.map((comp, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={comp.itemId}
                    onChange={(e) => updateComponentRow(index, "itemId", e.target.value)}
                    required
                    className="flex-1 border rounded px-2 py-2 text-sm"
                  >
                    <option value="">-- Item --</option>
                    {mockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={comp.quantity}
                    onChange={(e) => updateComponentRow(index, "quantity", e.target.value)}
                    required
                    className="w-20 border rounded px-2 py-2 text-sm"
                  />
                  <input
                    placeholder="Unit"
                    value={comp.unit}
                    onChange={(e) => updateComponentRow(index, "unit", e.target.value)}
                    required
                    className="w-20 border rounded px-2 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeComponentRow(index)}
                    disabled={form.components.length === 1}
                    className="text-red-600 text-sm px-2 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addComponentRow}
              className="text-blue-600 text-sm font-medium mb-4"
            >
              + Add Component
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