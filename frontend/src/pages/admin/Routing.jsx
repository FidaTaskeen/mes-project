import { useState, useEffect } from "react";
import { GitBranch, Clock, Settings2, X } from "lucide-react";
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

  const [selectedStep, setSelectedStep] = useState(null);

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

  const resolveOperation = (operation) => {
    if (typeof operation === "object") return operation;
    return operations.find((o) => o._id === operation) || null;
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Routing</h1>
          <p className="text-slate-500 text-sm">Manage operation sequences for each item.</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Routing
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : routings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-slate-400">
          No routings yet.
        </div>
      ) : (
        <div className="space-y-6">
          {routings.map((routing) => (
            <div key={routing._id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <GitBranch size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">{routing.routingCode}</p>
                    <p className="text-xs text-slate-500">{itemLabel(routing.item)}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => openEditForm(routing)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(routing._id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {routing.steps
                  .slice()
                  .sort((a, b) => a.sequenceNo - b.sequenceNo)
                  .map((step, i) => {
                    const op = resolveOperation(step.operation);
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedStep({ step, op })}
                        className="bg-white border rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-blue-400 hover:shadow-sm transition"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center relative">
                          <Settings2 size={18} />
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center">
                            {step.sequenceNo}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 leading-tight">
                          {op ? op.operationName : "—"}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedStep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Settings2 size={20} />
                </div>
                <div>
                  <p className="font-semibold">
                    {selectedStep.op ? selectedStep.op.operationName : "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Step {selectedStep.step.sequenceNo} in sequence
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedStep(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Operation Code</span>
                <span className="font-medium">{selectedStep.op?.operationCode || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Work Center</span>
                <span className="font-medium">{selectedStep.op?.workCenter || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Standard Time (this step)</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock size={14} />
                  {selectedStep.step.standardTime} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium">{selectedStep.op?.status || "—"}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedStep(null)}
              className="w-full mt-5 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingRouting ? "Edit Routing" : "Add Routing"}</h2>

            <label className="block text-sm font-medium mb-1">Routing Code</label>
            <input
              value={form.routingCode}
              onChange={(e) => setForm({ ...form, routingCode: e.target.value })}
              required
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Item</label>
            <select
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              required
              className="w-full border rounded-lg px-3 py-2 mb-4"
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
                    className="flex-1 border rounded-lg px-2 py-2 text-sm"
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
                    className="w-16 border rounded-lg px-2 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Time (min)"
                    value={step.standardTime}
                    onChange={(e) => updateStepRow(index, "standardTime", e.target.value)}
                    required
                    className="w-24 border rounded-lg px-2 py-2 text-sm"
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
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}