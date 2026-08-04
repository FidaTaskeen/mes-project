import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

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

const emptyForm = {
  itemCode: "",
  name: "",
  description: "",
  unitOfMeasure: "",
  itemType: "FG",
  status: "Active",
};

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/items", { params: { limit: 100 } });
      setItems(res.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openAddForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setForm({
      itemCode: item.itemCode,
      name: item.name,
      description: item.description || "",
      unitOfMeasure: item.unitOfMeasure,
      itemType: item.itemType,
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingItem) {
        await axiosInstance.put(`/items/${editingItem._id}`, form);
      } else {
        await axiosInstance.post("/items", form);
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      await axiosInstance.delete(`/items/${id}`);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item");
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

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400 text-sm">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{item.itemCode}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.description}>
                    {item.description || "—"}
                  </td>
                  <td className="px-4 py-3">{item.itemType}</td>
                  <td className="px-4 py-3">{item.unitOfMeasure}</td>
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
                    <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingItem ? "Edit Item" : "Add Item"}</h2>

            <label className="block text-sm font-medium mb-1">Item Code</label>
            <input
              value={form.itemCode}
              onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
              required
              placeholder="e.g. TVSE-PRN-001"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Inkjet Printer - Model X200"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="e.g. Compact desktop inkjet printer, USB + Wi-Fi, tray capacity 100 sheets"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.itemType}
              onChange={(e) => setForm({ ...form, itemType: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="RM">Raw Material</option>
              <option value="WIP">Work in Progress</option>
              <option value="FG">Finished Goods</option>
            </select>

            <label className="block text-sm font-medium mb-1">Unit of Measure</label>
            <input
              value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
              required
              placeholder="e.g. PCS"
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
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}