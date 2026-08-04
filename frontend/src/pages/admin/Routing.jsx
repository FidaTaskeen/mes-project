import { useState, useEffect } from "react";
import { Pencil, Trash2, Eye } from "lucide-react";
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
  routingCode: "",
  bom: "",
  version: "Version 1",
  status: "Active",
  description: "",
  steps: [{ operation: "", sequenceNo: "", standardTime: "" }],
};

export default function Routing() {
  const [routings, setRoutings] = useState([]);
  const [boms, setBoms] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Active");

  const [showForm, setShowForm] = useState(false);
  const [editingRouting, setEditingRouting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [viewingRouting, setViewingRouting] = useState(null);

  const [filters, setFilters] = useState({ routingCode: "" });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.routingCode) params.set("search", filters.routingCode);
      params.set("status", tab);
      params.set("limit", "100");

      const [routingsRes, bomsRes, opsRes] = await Promise.all([
        axiosInstance.get(`/routings?${params.toString()}`),
        axiosInstance.get("/boms?limit=100"),
        axiosInstance.get("/operations?limit=100"),
      ]);
      setRoutings(routingsRes.data.routings || []);
      setBoms(bomsRes.data.boms || []);
      setOperations(opsRes.data.operations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const openAddForm = () => {
    setEditingRouting(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (routing) => {
    setEditingRouting(routing);
    setForm({
      routingCode: routing.routingCode,
      bom: routing.bom?._id || routing.bom || "",
      version: routing.version || "Version 1",
      status: routing.status,
      description: routing.description || "",
      steps: routing.steps.map((s) => ({
        operation: s.operation?._id || s.operation,
        sequenceNo: s.sequenceNo,
        standardTime: s.standardTime,
      })),
    });
    setShowForm(true);
  };

  const updateStepRow = (index, field, value) => {
    const updatedSteps = form.steps.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    setForm({ ...form, steps: updatedSteps });
  };
  const addStepRow = () => {
    setForm({ ...form, steps: [...form.steps, { operation: "", sequenceNo: "", standardTime: "" }] });
  };
  const removeStepRow = (index) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
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

  const bomLabel = (bom) => {
    if (!bom) return "—";
    if (typeof bom === "object") return bom.bomCode;
    const found = boms.find((b) => b._id === bom);
    return found ? found.bomCode : "—";
  };

  const itemName = (item) => {
    if (!item) return "—";
    if (typeof item === "object") return `${item.itemCode} - ${item.name}`;
    return "—";
  };

  const tabs = ["Active", "Draft", "Inactive"];

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Routing</h1>
          <p className="text-slate-500 text-sm">Masters &gt; Routing (built from a BOM)</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Create New
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Routing Code</label>
            <input
              value={filters.routingCode}
              onChange={(e) => setFilters({ ...filters, routingCode: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ routingCode: "" });
              loadData();
            }}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === t ? "bg-slate-800 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Routing Code</th>
              <th className="px-4 py-3">BOM</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created On</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : routings.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">No routings found.</td></tr>
            ) : (
              routings.map((routing) => (
                <tr key={routing._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{routing.routingCode}</td>
                  <td className="px-4 py-3">{bomLabel(routing.bom)}</td>
                  <td className="px-4 py-3">{itemName(routing.item)}</td>
                  <td className="px-4 py-3">{routing.version}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        routing.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : routing.status === "Draft"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {routing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {routing.createdAt ? new Date(routing.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingRouting(routing)}
                        className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditForm(routing)}
                        className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(routing._id)}
                        className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingRouting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">{viewingRouting.routingCode}</h2>
            <p className="text-sm text-slate-500 mb-4">
              BOM: {bomLabel(viewingRouting.bom)} • Item: {itemName(viewingRouting.item)}
            </p>
            <div className="border-t pt-3 space-y-2">
              {viewingRouting.steps
                .slice()
                .sort((a, b) => a.sequenceNo - b.sequenceNo)
                .map((s, i) => {
                  const op = typeof s.operation === "object" ? s.operation : operations.find((o) => o._id === s.operation);
                  return (
                    <div key={i} className="flex justify-between text-sm border-b pb-2">
                      <span>{s.sequenceNo}. {op ? `${op.operationCode} - ${op.operationName}` : "—"}</span>
                      <span className="text-slate-400">{s.standardTime} min</span>
                    </div>
                  );
                })}
            </div>
            <button
              onClick={() => setViewingRouting(null)}
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

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Routing Code</label>
                <input
                  value={form.routingCode}
                  onChange={(e) => setForm({ ...form, routingCode: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BOM</label>
                <select
                  value={form.bom}
                  onChange={(e) => setForm({ ...form, bom: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Select BOM --</option>
                  {boms.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bomCode} ({b.parentItem?.itemCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Version</label>
                <input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

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
                      <option key={o._id} value={o._id}>{o.operationCode} - {o.operationName}</option>
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
                    placeholder="Time"
                    value={step.standardTime}
                    onChange={(e) => updateStepRow(index, "standardTime", e.target.value)}
                    required
                    className="w-20 border rounded-lg px-2 py-2 text-sm"
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
            <button type="button" onClick={addStepRow} className="text-blue-600 text-sm font-medium mb-4">
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