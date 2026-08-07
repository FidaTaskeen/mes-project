import { useEffect, useState } from "react";
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
  version: "v1",
  status: "Active",
  steps: [],
};

const emptyFilters = {
  routingCode: "",
  itemNo: "",
  description: "",
  version: "",
  status: "",
};

export default function Routing() {
  const [routings, setRoutings] = useState([]);
  const [boms, setBoms] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState(emptyFilters);

  const [showForm, setShowForm] = useState(false);
  const [editingRouting, setEditingRouting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [viewingRouting, setViewingRouting] = useState(null);

  useEffect(() => {
    loadBoms();
    loadOperations();
    loadRoutings();
  }, []);

  const loadBoms = async () => {
    try {
      const res = await axiosInstance.get("/boms?limit=100");
      setBoms((res.data.boms || []).filter((b) => b.status === "Active"));
    } catch (err) {
      console.error(err);
    }
  };

  const loadOperations = async () => {
    try {
      const res = await axiosInstance.get("/operations/active/list");
      setOperations(res.data.operations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoutings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/routings?limit=100");
      setRoutings(res.data.routings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routings");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutings = routings.filter((r) => {
    if (
      filters.routingCode &&
      !r.routingCode?.toLowerCase().includes(filters.routingCode.toLowerCase())
    )
      return false;

    if (
      filters.itemNo &&
      !r.item?.itemCode?.toLowerCase().includes(filters.itemNo.toLowerCase())
    )
      return false;

    if (
      filters.description &&
      !r.item?.name?.toLowerCase().includes(filters.description.toLowerCase()) &&
      !r.item?.description?.toLowerCase().includes(filters.description.toLowerCase())
    )
      return false;

    if (
      filters.version &&
      !r.version?.toLowerCase().includes(filters.version.toLowerCase())
    )
      return false;

    if (filters.status && r.status !== filters.status) return false;

    return true;
  });

  const clearFilters = () => setFilters(emptyFilters);

  const generateRoutingCode = () => {
    const next = routings.length + 1;
    return `RT-${String(next).padStart(3, "0")}`;
  };

  const openAddForm = () => {
    setEditingRouting(null);
    setForm({ ...emptyForm, routingCode: generateRoutingCode() });
    setShowForm(true);
  };

  const openEditForm = (routing) => {
    setEditingRouting(routing);
    setForm({
      routingCode: routing.routingCode,
      bom: routing.bom?._id || routing.bom,
      version: routing.version,
      status: routing.status,
      steps: routing.steps.map((s) => ({
        operation: s.operation?._id || s.operation,
        sequenceNo: s.sequenceNo,
        standardTime: s.standardTime,
      })),
    });
    setShowForm(true);
  };

  const addAllOperations = () => {
    const steps = operations.map((op, index) => ({
      operation: op._id,
      sequenceNo: (index + 1) * 10,
      standardTime: op.standardTime || 0,
    }));
    setForm({ ...form, steps });
  };

  const addStep = () => {
    const nextSeq = form.steps.length
      ? Math.max(...form.steps.map((s) => s.sequenceNo)) + 10
      : 10;
    setForm({
      ...form,
      steps: [...form.steps, { operation: "", sequenceNo: nextSeq, standardTime: 0 }],
    });
  };

  const updateStep = (index, field, value) => {
    const updated = [...form.steps];
    updated[index][field] = value;

    if (field === "operation") {
      const op = operations.find((o) => o._id === value);
      if (op) updated[index].standardTime = op.standardTime;
    }

    setForm({ ...form, steps: updated });
  };

  const removeStep = (index) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingRouting) {
        await axiosInstance.put(`/routings/${editingRouting._id}`, form);
      } else {
        await axiosInstance.post("/routings", form);
      }
      setShowForm(false);
      loadRoutings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save routing");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this routing?")) return;
    try {
      await axiosInstance.delete(`/routings/${id}`);
      loadRoutings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete routing");
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Routing Master</h1>
          <p className="text-slate-500 text-sm">Item → BOM → Routing</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Create Routing
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Routing Code</label>
            <input
              value={filters.routingCode}
              onChange={(e) => setFilters({ ...filters, routingCode: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item No</label>
            <input
              value={filters.itemNo}
              onChange={(e) => setFilters({ ...filters, itemNo: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              value={filters.description}
              onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Version</label>
            <input
              value={filters.version}
              onChange={(e) => setFilters({ ...filters, version: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Routing Code</th>
              <th className="px-4 py-3 text-left">Item No</th>
              <th className="px-4 py-3 text-left">Item No - Description</th>
              <th className="px-4 py-3 text-left">BOM Code</th>
              <th className="px-4 py-3 text-left">Version</th>
              <th className="px-4 py-3 text-left">Operations</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : filteredRoutings.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No routings found.</td></tr>
            ) : (
              filteredRoutings.map((routing) => (
                <tr key={routing._id} className="border-t align-top">
                  <td className="px-4 py-3 font-medium text-blue-700">{routing.routingCode}</td>
                  <td className="px-4 py-3">{routing.item?.itemCode}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <span title={routing.item?.description} className="text-slate-500 line-clamp-1">
                      {routing.item?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">{routing.bom?.bomCode}</td>
                  <td className="px-4 py-3">{routing.version}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {routing.steps?.length || 0} operation{routing.steps?.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        routing.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {routing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => setViewingRouting(routing)}
                      className="text-slate-600 hover:text-blue-600"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button onClick={() => openEditForm(routing)} className="text-blue-600" title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(routing._id)} className="text-red-600" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {viewingRouting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold text-blue-700">{viewingRouting.routingCode}</h2>
                <p className="text-slate-500 text-sm">
                  {viewingRouting.item?.itemCode} — {viewingRouting.item?.name}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs h-fit ${
                  viewingRouting.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {viewingRouting.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
              <div>
                <div className="text-slate-400 text-xs">BOM Code</div>
                <div className="font-medium">{viewingRouting.bom?.bomCode || "—"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Version</div>
                <div className="font-medium">{viewingRouting.version}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-xs">Description</div>
                <div className="font-medium">{viewingRouting.item?.description || "—"}</div>
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-sm">Routing Operations</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Seq</th>
                    <th className="px-3 py-2 text-left">Operation Code</th>
                    <th className="px-3 py-2 text-left">Operation Name</th>
                    <th className="px-3 py-2 text-left">Std Time</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRouting.steps?.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{s.sequenceNo}</td>
                      <td className="px-3 py-2">{s.operation?.operationCode || "—"}</td>
                      <td className="px-3 py-2">{s.operation?.operationName || "—"}</td>
                      <td className="px-3 py-2">{s.standardTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setViewingRouting(null)}
                className="px-4 py-2 text-sm text-slate-600 border rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-5">
              {editingRouting ? "Edit Routing" : "Create Routing"}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium mb-1">Routing Code</label>
                <input
                  value={form.routingCode}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">BOM</label>
                <select
                  value={form.bom}
                  onChange={(e) => setForm({ ...form, bom: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select BOM</option>
                  {boms.map((bom) => (
                    <option key={bom._id} value={bom._id}>
                      {bom.bomCode} — {bom.parentItem?.itemCode} ({bom.parentItem?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Version</label>
                <input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Routing Operations</h3>
                <div className="flex gap-3">
                  <button type="button" onClick={addAllOperations} className="text-blue-600 text-sm font-medium">
                    + Add All Active Operations
                  </button>
                  <button type="button" onClick={addStep} className="text-blue-600 text-sm font-medium">
                    + Add Operation
                  </button>
                </div>
              </div>

              {form.steps.length === 0 && (
                <p className="text-sm text-slate-400 mb-2">No operations added yet.</p>
              )}

              {form.steps.map((step, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center mb-3">
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={step.sequenceNo}
                      onChange={(e) => updateStep(index, "sequenceNo", Number(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Seq"
                    />
                  </div>

                  <div className="col-span-6">
                    <select
                      value={step.operation}
                      onChange={(e) => updateStep(index, "operation", e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Operation</option>
                      {operations.map((op) => (
                        <option key={op._id} value={op._id}>
                          {op.operationCode} - {op.operationName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      value={step.standardTime}
                      onChange={(e) => updateStep(index, "standardTime", Number(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Std Time"
                    />
                  </div>

                  <div className="col-span-2">
                    <button type="button" onClick={() => removeStep(index)} className="text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Routing"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}