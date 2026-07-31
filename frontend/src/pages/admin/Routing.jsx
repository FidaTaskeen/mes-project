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

export default function Routing() {
  const [routings, setRoutings] = useState([]);
  const [items, setItems] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRouting, setEditingRouting] = useState(null);
  const [form, setForm] = useState({
    routingCode: "",
    item: "",
    steps: [{ operation: "", sequenceNo: "", standardTime: "" }],
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [routingsRes, itemsRes, opsRes] = await Promise.all([
        axiosInstance.get("/routings?limit=100"),
        axiosInstance.get("/items?limit=100"),
        axiosInstance.get("/operations?limit=100"),
      ]);
      setRoutings(routingsRes.data.routings || []);
      setItems(itemsRes.data.items || []);
      setOperations(opsRes.data.operations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setEditingRouting(null);
    setForm({
      routingCode: "",
      item: "",
      steps: [{ operation: "", sequenceNo: "", standardTime: "" }],
    });
    setShowForm(true);
  };

  const openEditForm = (routing) => {
    setEditingRouting(routing);
    setForm({
      routingCode: routing.routingCode,
      item: routing.item?._id || routing.item,
      steps: routing.steps.map((s) => ({
        operation: s.operation?._id || s.operation,
        sequenceNo: s.sequenceNo,
        standardTime: s.standardTime,
      })),
    });
    setShowForm(true);
  };

  const updateStepRow = (index, field, value) => {
    const updatedSteps = form.steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setForm({ ...form, steps: updatedSteps });
  };

  const addStepRow = () => {
    setForm({
      ...form,
      steps: [...form.steps, { operation: "", sequenceNo: "", standardTime: "" }],
    });
  };

  const removeStepRow = (index) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      routingCode: form.routingCode,
      item: form.item,
      steps: form.steps.map((s) => ({
        operation: s.operation,
        sequenceNo: Number(s.sequenceNo),
        standardTime: Number(s.standardTime),
      })),
    };
    try {
      if (editingRouting) {
        await axiosInstance.put(`/routings/${editingRouting._id}`, payload);
      } else {
        await axiosInstance.post("/routings", payload);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save routing");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this routing?")) return;
    try {
      await axiosInstance.delete(`/routings/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete routing");
    }
  };

  const itemLabel = (item) => {
    if (!item) return "—";
    if (typeof item === "object") return `${item.itemCode} - ${item.name}`;
    const found = items.find((i) => i._id === item);
    return found ? `${found.itemCode} - ${found.name}` : "—";
  };

  const operationLabel = (operation) => {
    if (!operation) return "—";
    if (typeof operation === "object") return `${operation.operationCode} - ${operation.operationName}`;
    const found = operations.find((o) => o._id === operation);
    return found ? `${found.operationCode} - ${found.operationName}` : "—";
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

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">Routing Code</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Operations (in sequence)</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routings.map((routing) => (
                <tr key={routing._id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium">{routing.routingCode}</td>
                  <td className="px-4 py-3">{itemLabel(routing.item)}</td>
                  <td className="px-4 py-3">
                    {routing.steps
                      .slice()
                      .sort((a, b) => a.sequenceNo - b.sequenceNo)
                      .map((step, i) => (
                        <div key={i} className="text-slate-600">
                          {step.sequenceNo}. {operationLabel(step.operation)} ({step.standardTime} min)
                        </div>
                      ))}
                  </td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => openEditForm(routing)} className="text-blue-600 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(routing._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {routings.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-slate-400">
                    No routings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingRouting ? "Edit Routing" : "Add Routing"}</h2>

            <label className="block text-sm font-medium mb-1">Routing Code</label>
            <input
              value={form.routingCode}
              onChange={(e) => setForm({ ...form, routingCode: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Item</label>
            <select
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="">-- Select Item --</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.itemCode} - {item.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-2">Operations in Sequence</label>
            <div className="space-y-2 mb-3">
              {form.steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <select
                    value={step.operation}
                    onChange={(e) => updateStepRow(index, "operation", e.target.value)}
                    required
                    className="flex-1 border rounded px-2 py-2 text-sm"
                  >
                    <option value="">-- Operation --</option>
                    {operations.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.operationCode} - {o.operationName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Seq"
                    value={step.sequenceNo}
                    onChange={(e) => updateStepRow(index, "sequenceNo", e.target.value)}
                    required
                    className="w-16 border rounded px-2 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Time (min)"
                    value={step.standardTime}
                    onChange={(e) => updateStepRow(index, "standardTime", e.target.value)}
                    required
                    className="w-24 border rounded px-2 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeStepRow(index)}
                    disabled={form.steps.length === 1}
                    className="text-red-600 text-sm px-2 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addStepRow}
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