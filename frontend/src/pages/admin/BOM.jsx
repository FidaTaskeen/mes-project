import { useEffect, useState } from "react";
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
  bomCode: "",
  parentItem: "",
  version: "v1",
  components: [{ item: "", quantity: 1, unit: "PCS" }],
  status: "Active",
};

export default function BOM() {
  const [items, setItems] = useState([]);
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingBom, setEditingBom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
    loadBoms();
  }, []);

  const loadItems = async () => {
    try {
      const res = await axiosInstance.get("/items/active/list");
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBoms = async () => {
    try {
      const res = await axiosInstance.get("/boms?limit=100");
      setBoms(res.data.boms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateBomCode = () => {
    const next = boms.length + 1;
    return `BOM-${String(next).padStart(3, "0")}`;
  };

  const openAddForm = () => {
    setEditingBom(null);
    setForm({
      ...emptyForm,
      bomCode: generateBomCode(),
    });
    setShowForm(true);
  };

  const openEditForm = (bom) => {
    setEditingBom(bom);
    setForm({
      bomCode: bom.bomCode,
      parentItem: bom.parentItem?._id || bom.parentItem,
      version: bom.version,
      components: bom.components.map((c) => ({
        item: c.item?._id || c.item,
        quantity: c.quantity,
        unit: c.unit,
      })),
      status: bom.status,
    });
    setShowForm(true);
  };

  const updateComponent = (index, field, value) => {
    const updated = [...form.components];
    updated[index][field] = value;
    setForm({ ...form, components: updated });
  };

  const addComponent = () => {
    setForm({
      ...form,
      components: [
        ...form.components,
        { item: "", quantity: 1, unit: "PCS" },
      ],
    });
  };

  const removeComponent = (index) => {
    if (form.components.length === 1) return;

    setForm({
      ...form,
      components: form.components.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingBom) {
        await axiosInstance.put(`/boms/${editingBom._id}`, form);
      } else {
        await axiosInstance.post("/boms", form);
      }

      setShowForm(false);
      loadBoms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save BOM");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this BOM?")) return;

    try {
      await axiosInstance.delete(`/boms/${id}`);
      loadBoms();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete BOM");
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">BOM Master</h1>
          <p className="text-sm text-slate-500">
            Create BOM against Item No from Item Master
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Create BOM
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">BOM Code</th>
                <th className="px-4 py-3">Item No</th>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Components</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {boms.map((bom) => (
                <tr key={bom._id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {bom.bomCode}
                  </td>

                  <td className="px-4 py-3">
                    {bom.parentItem?.itemCode}
                  </td>

                  <td className="px-4 py-3">
                    {bom.parentItem?.name}
                  </td>

                  <td className="px-4 py-3">
                    {bom.version}
                  </td>

                  <td className="px-4 py-3">
                    {bom.components?.map((c, index) => (
                      <div key={index}>
                        {c.item?.itemCode} - {c.item?.name}
                        {" "}({c.quantity} {c.unit})
                      </div>
                    ))}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        bom.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {bom.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 space-x-3">
                    <button
                      onClick={() => openEditForm(bom)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(bom._id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {boms.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-slate-400"
                  >
                    No BOMs found.
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
            className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-5">
              {editingBom ? "Edit BOM" : "Create BOM"}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium mb-1">
                  BOM Code
                </label>
                <input
                  value={form.bomCode}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Item No
                </label>
                <select
                  value={form.parentItem}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      parentItem: e.target.value,
                    })
                  }
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.itemCode} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Version
                </label>
                <input
                  value={form.version}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      version: e.target.value,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
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
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">BOM Components</h3>

                <button
                  type="button"
                  onClick={addComponent}
                  className="text-blue-600 text-sm font-medium"
                >
                  + Add Component
                </button>
              </div>

              {form.components.map((comp, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-3 items-center mb-3"
                >
                  <div className="col-span-6">
                    <select
                      value={comp.item}
                      onChange={(e) =>
                        updateComponent(
                          index,
                          "item",
                          e.target.value
                        )
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Component</option>
                      {items.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.itemCode} - {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={comp.quantity}
                      onChange={(e) =>
                        updateComponent(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      value={comp.unit}
                      onChange={(e) =>
                        updateComponent(index, "unit", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div className="col-span-2">
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
                {saving ? "Saving..." : "Save BOM"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}