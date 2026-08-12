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
  itemType: "FG",
  unitOfMeasure: "PCS",
  serialNoLength: "",
  description: "",
  status: "Active",
};

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/items?limit=100");
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
      itemType: item.itemType,
      unitOfMeasure: item.unitOfMeasure,
      serialNoLength: item.serialNoLength || "",
      description: item.description || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        serialNoLength: form.serialNoLength ? Number(form.serialNoLength) : null,
      };
      if (editingItem) {
        await axiosInstance.put(`/items/${editingItem._id}`, payload);
      } else {
        await axiosInstance.post("/items", payload);
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
    if (!window.confirm("Delete this item?")) return;
    try {
      await axiosInstance.delete(`/items/${id}`);
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete item");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Item Master</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create items — then build a BOM against this item, then a Routing against that BOM.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <input
          type="text"
          placeholder="Search by Item Code or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">Item Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">UOM</th>
                <th className="px-4 py-3">Serial No. Length</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-blue-700">{item.itemCode}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.itemType}</td>
                  <td className="px-4 py-3">{item.unitOfMeasure}</td>
                  <td className="px-4 py-3">{item.serialNoLength || "—"}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <span title={item.description} className="text-slate-500 line-clamp-1">
                      {item.description || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-500"
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
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
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
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editingItem ? "Edit Item" : "Add Item"}</h2>

            <label className="block text-sm font-medium mb-1">Item Code</label>
            <input
              value={form.itemCode}
              onChange={(e) => setForm({ ...form, itemCode: e.target.value.toUpperCase() })}
              required
              placeholder="e.g. TVSE-SCN-01"
              className="w-full border rounded px-3 py-2 mb-3 uppercase"
            />

            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Barcode Scanner"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Item Type</label>
            <select
              value={form.itemType}
              onChange={(e) => setForm({ ...form, itemType: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="FG">FG (Finished Good)</option>
              <option value="WIP">WIP (Work in Progress)</option>
              <option value="RM">RM (Raw Material)</option>
            </select>

            <label className="block text-sm font-medium mb-1">Unit of Measure</label>
            <input
              value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
              required
              placeholder="e.g. PCS"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Serial No. Length</label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.serialNoLength}
              onChange={(e) => setForm({ ...form, serialNoLength: e.target.value })}
              placeholder="e.g. 15"
              className="w-full border rounded px-3 py-2 mb-1"
            />
            <p className="text-xs text-slate-400 mb-3">
              Number of digits the Operator's scanned serial number must have for this item. Leave blank if not enforced.
            </p>

            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Short description..."
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-5"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}