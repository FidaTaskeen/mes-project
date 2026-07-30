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

// Mock data — stands in for the backend until it's ready.
// Once connected, this will instead come from: GET /api/items
const initialItems = [
  { id: 1, itemCode: "ITM-001", name: "Steel Rod", type: "RM", unit: "kg", status: "Active" },
  { id: 2, itemCode: "ITM-002", name: "Bracket Assembly", type: "WIP", unit: "pcs", status: "Active" },
  { id: 3, itemCode: "ITM-003", name: "Finished Motor", type: "FG", unit: "pcs", status: "Inactive" },
];

export default function AdminItems() {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ itemCode: "", name: "", type: "RM", unit: "", status: "Active" });

  const openAddForm = () => {
    setEditingItem(null);
    setForm({ itemCode: "", name: "", type: "RM", unit: "", status: "Active" });
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm(item);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Later: PUT /api/items/:id
      setItems(items.map((it) => (it.id === editingItem.id ? { ...form, id: editingItem.id } : it)));
    } else {
      // Later: POST /api/items
      setItems([...items, { ...form, id: Date.now() }]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    // Later: DELETE /api/items/:id
    if (confirm("Delete this item?")) {
      setItems(items.filter((it) => it.id !== id));
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Items</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.itemCode}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      item.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => openEditForm(item)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingItem ? "Edit Item" : "Add Item"}</h2>

            <label className="block text-sm font-medium mb-1">Item Code</label>
            <input
              value={form.itemCode}
              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
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

            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="RM">Raw Material</option>
              <option value="WIP">Work in Progress</option>
              <option value="FG">Finished Goods</option>
            </select>

            <label className="block text-sm font-medium mb-1">Unit of Measure</label>
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

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