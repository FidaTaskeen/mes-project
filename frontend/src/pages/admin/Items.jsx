import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  { items: [{ label: "Admin Dashboard", path: "/admin/dashboard" }] },
  {
    title: "MASTER DATA",
    items: [
      { label: "Items", path: "/admin/items" },
      { label: "BOM", path: "/admin/bom" },
      { label: "Routing", path: "/admin/routing" },
      { label: "Users", path: "/admin/users" },
    ],
  },
];

const emptyForm = {
  itemNo: "",
  itemName: "",
  category: "Printer",
  uom: "Nos",
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
      const res = await axiosInstance.get("/items");
      let data = res.data.items || [];

      if (data.length === 0) {
        const dummy = {
          itemNo: "PR001",
          itemName: "TVSE Thermal Printer",
          category: "Printer",
          uom: "Nos",
          description:
            "TVSE Thermal Printer\nUSB + Ethernet Interface\n203 DPI Industrial Printing",
          status: "Active",
        };

        await axiosInstance.post("/items", dummy);
        const reload = await axiosInstance.get("/items");
        data = reload.data.items || [];
      }

      setItems(data);
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
      itemNo: item.itemNo,
      itemName: item.itemName,
      category: item.category,
      uom: item.uom,
      description: item.description,
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
      item.itemNo?.toLowerCase().includes(search.toLowerCase()) ||
      item.itemName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">TVSE Item Master</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create manufacturing items for BOM, Routing, and Job Orders
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
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <input
          type="text"
          placeholder="Search by Item No or Item Name"
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
                <th className="px-4 py-3">Item No</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">UOM</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item) => (
                <tr key={item._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {item.itemNo}
                  </td>

                  <td className="px-4 py-3">
                    {item.itemName}
                  </td>

                  <td className="px-4 py-3">
                    {item.category}
                  </td>

                  <td className="px-4 py-3">
                    {item.uom}
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    <button
                      className="text-blue-600 hover:underline text-left"
                      title={item.description}
                    >
                      View Description
                    </button>
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
                    <button
                      onClick={() => openEditForm(item)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
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
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-5">
              {editingItem ? "Edit Item" : "Add TVSE Item"}
            </h2>

            <label className="block text-sm font-medium mb-1">
              Item No
            </label>
            <input
              value={form.itemNo}
              onChange={(e) =>
                setForm({
                  ...form,
                  itemNo: e.target.value.toUpperCase(),
                })
              }
              required
              placeholder="PR001"
              className="w-full border rounded px-3 py-2 mb-3 uppercase"
            />

            <label className="block text-sm font-medium mb-1">
              Item Name
            </label>
            <input
              value={form.itemName}
              onChange={(e) =>
                setForm({
                  ...form,
                  itemName: e.target.value,
                })
              }
              required
              placeholder="TVSE Thermal Printer"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              className="w-full border rounded px-3 py-2 mb-3"
            >
              <option value="Printer">Printer</option>
              <option value="Scanner">Scanner</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Mouse">Mouse</option>
              <option value="PCB">PCB</option>
            </select>

            <label className="block text-sm font-medium mb-1">
              UOM
            </label>
            <input
              value={form.uom}
              onChange={(e) =>
                setForm({
                  ...form,
                  uom: e.target.value,
                })
              }
              required
              placeholder="Nos"
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              Description (3 Lines)
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              rows={3}
              placeholder={`TVSE Thermal Printer
USB + Ethernet Interface
203 DPI Industrial Printing`}
              className="w-full border rounded px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
              className="w-full border rounded px-3 py-2 mb-5"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-slate-600"
              >
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