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
  description: "",
  inputItemDescription: "",
  validFrom: "",
  validTo: "",
  firstScanningOperation: "",
  activeOperation: "",
  consumptionOperation: "",
  finalOperation: "",
  setupVerification: false,
  inventoryValidation: false,
  sampleRun: false,
  steps: [],
};

const emptyFilters = {
  itemNo: "",
  status: "",
  description: "",
  firstScanningOperation: "",
  finalOperation: "",
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
      filters.itemNo &&
      !r.item?.itemCode?.toLowerCase().includes(filters.itemNo.toLowerCase())
    )
      return false;

    if (filters.status && r.status !== filters.status) return false;

    if (
      filters.description &&
      !r.description?.toLowerCase().includes(filters.description.toLowerCase()) &&
      !r.item?.name?.toLowerCase().includes(filters.description.toLowerCase())
    )
      return false;

    if (
      filters.firstScanningOperation &&
      r.firstScanningOperation?._id !== filters.firstScanningOperation
    )
      return false;

    if (filters.finalOperation && r.finalOperation?._id !== filters.finalOperation)
      return false;

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
      description: routing.description || "",
      inputItemDescription: routing.inputItemDescription || "",
      validFrom: routing.validFrom ? routing.validFrom.slice(0, 10) : "",
      validTo: routing.validTo ? routing.validTo.slice(0, 10) : "",
      firstScanningOperation: routing.firstScanningOperation?._id || "",
      activeOperation: routing.activeOperation?._id || "",
      consumptionOperation: routing.consumptionOperation?._id || "",
      finalOperation: routing.finalOperation?._id || "",
      setupVerification: !!routing.setupVerification,
      inventoryValidation: !!routing.inventoryValidation,
      sampleRun: !!routing.sampleRun,
      steps: routing.steps.map((s) => ({
        operation: s.operation?._id || s.operation,
        sequenceNo: s.sequenceNo,
        stage: s.stage || "Middle",
        previousOperation: s.previousOperation?._id || s.previousOperation || "",
        type: s.type || "No_Scanning",
        scan: s.scan || "None",
        standardTime: s.standardTime || 0,
      })),
    });
    setShowForm(true);
  };

  const addAllOperations = () => {
    const steps = operations.map((op, index) => ({
      operation: op._id,
      sequenceNo: (index + 1) * 10,
      stage: index === 0 ? "Start" : index === operations.length - 1 ? "End" : "Middle",
      previousOperation: index === 0 ? "" : operations[index - 1]._id,
      type: "No_Scanning",
      scan: "None",
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
      steps: [
        ...form.steps,
        {
          operation: "",
          sequenceNo: nextSeq,
          stage: "Middle",
          previousOperation: "",
          type: "No_Scanning",
          scan: "None",
          standardTime: 0,
        },
      ],
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

  const opLabel = (op) => (op ? `${op.operationCode} - ${op.operationName}` : "—");

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
            <label className="block text-xs font-medium text-slate-500 mb-1">Item No</label>
            <input
              value={filters.itemNo}
              onChange={(e) => setFilters({ ...filters, itemNo: e.target.value })}
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
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              value={filters.description}
              onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              First Scanning Operation
            </label>
            <select
              value={filters.firstScanningOperation}
              onChange={(e) =>
                setFilters({ ...filters, firstScanningOperation: e.target.value })
              }
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.operationCode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Final Operation
            </label>
            <select
              value={filters.finalOperation}
              onChange={(e) => setFilters({ ...filters, finalOperation: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>
                  {op.operationCode}
                </option>
              ))}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 text-sm">
              <div>
                <div className="text-slate-400 text-xs">BOM Code</div>
                <div className="font-medium">{viewingRouting.bom?.bomCode || "—"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Version</div>
                <div className="font-medium">{viewingRouting.version}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Valid From</div>
                <div className="font-medium">
                  {viewingRouting.validFrom ? viewingRouting.validFrom.slice(0, 10) : "—"}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Valid To</div>
                <div className="font-medium">
                  {viewingRouting.validTo ? viewingRouting.validTo.slice(0, 10) : "—"}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-xs">Description</div>
                <div className="font-medium">{viewingRouting.description || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-xs">Input Item Description</div>
                <div className="font-medium">{viewingRouting.inputItemDescription || "—"}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">First Scanning Operation</div>
                <div className="font-medium">{opLabel(viewingRouting.firstScanningOperation)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Active Operation</div>
                <div className="font-medium">{opLabel(viewingRouting.activeOperation)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Consumption Operation</div>
                <div className="font-medium">{opLabel(viewingRouting.consumptionOperation)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs">Final Operation</div>
                <div className="font-medium">{opLabel(viewingRouting.finalOperation)}</div>
              </div>
              <div className="col-span-2 flex gap-4 text-xs">
                <span className={viewingRouting.setupVerification ? "text-green-700" : "text-slate-400"}>
                  {viewingRouting.setupVerification ? "✓" : "✗"} Setup Verification
                </span>
                <span className={viewingRouting.inventoryValidation ? "text-green-700" : "text-slate-400"}>
                  {viewingRouting.inventoryValidation ? "✓" : "✗"} Inventory Validation
                </span>
                <span className={viewingRouting.sampleRun ? "text-green-700" : "text-slate-400"}>
                  {viewingRouting.sampleRun ? "✓" : "✗"} Sample Run
                </span>
              </div>
            </div>

            <h3 className="font-semibold mb-2 text-sm">Routing Lines</h3>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Seq</th>
                    <th className="px-3 py-2 text-left">Operation</th>
                    <th className="px-3 py-2 text-left">Stage</th>
                    <th className="px-3 py-2 text-left">Previous Operation</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRouting.steps?.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{s.sequenceNo}</td>
                      <td className="px-3 py-2">{opLabel(s.operation)}</td>
                      <td className="px-3 py-2">{s.stage}</td>
                      <td className="px-3 py-2">{opLabel(s.previousOperation)}</td>
                      <td className="px-3 py-2">{s.type}</td>
                      <td className="px-3 py-2">{s.scan}</td>
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

      {/* Create / Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold mb-5">
              {editingRouting ? "Edit Routing" : "Create Routing"}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
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

              <div>
                <label className="block text-sm font-medium mb-1">Valid From</label>
                <input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valid To</label>
                <input
                  type="date"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="col-span-2 md:col-span-3">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="col-span-2 md:col-span-3">
                <label className="block text-sm font-medium mb-1">Input Item Description</label>
                <input
                  value={form.inputItemDescription}
                  onChange={(e) => setForm({ ...form, inputItemDescription: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">First Scanning Operation</label>
                <select
                  value={form.firstScanningOperation}
                  onChange={(e) => setForm({ ...form, firstScanningOperation: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {operations.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.operationCode} - {op.operationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Active Operation</label>
                <select
                  value={form.activeOperation}
                  onChange={(e) => setForm({ ...form, activeOperation: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {operations.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.operationCode} - {op.operationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Consumption Operation</label>
                <select
                  value={form.consumptionOperation}
                  onChange={(e) => setForm({ ...form, consumptionOperation: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {operations.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.operationCode} - {op.operationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Final Operation</label>
                <select
                  value={form.finalOperation}
                  onChange={(e) => setForm({ ...form, finalOperation: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">None</option>
                  {operations.map((op) => (
                    <option key={op._id} value={op._id}>
                      {op.operationCode} - {op.operationName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 md:col-span-3 flex gap-6 items-center pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.setupVerification}
                    onChange={(e) => setForm({ ...form, setupVerification: e.target.checked })}
                  />
                  Setup Verification
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.inventoryValidation}
                    onChange={(e) => setForm({ ...form, inventoryValidation: e.target.checked })}
                  />
                  Inventory Validation
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.sampleRun}
                    onChange={(e) => setForm({ ...form, sampleRun: e.target.checked })}
                  />
                  Sample Run
                </label>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Routing Lines ({form.steps.length})</h3>
                <div className="flex gap-3">
                  <button type="button" onClick={addAllOperations} className="text-blue-600 text-sm font-medium">
                    + Add All Active Operations
                  </button>
                  <button type="button" onClick={addStep} className="text-blue-600 text-sm font-medium">
                    + Add Line
                  </button>
                </div>
              </div>

              {form.steps.length === 0 && (
                <p className="text-sm text-slate-400 mb-2">No routing lines added yet.</p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="pb-2 pr-2 w-16">Seq</th>
                      <th className="pb-2 pr-2 min-w-[180px]">Operation</th>
                      <th className="pb-2 pr-2 w-28">Stage</th>
                      <th className="pb-2 pr-2 min-w-[180px]">Previous Operation</th>
                      <th className="pb-2 pr-2 w-36">Type</th>
                      <th className="pb-2 pr-2 w-32">Scan</th>
                      <th className="pb-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.steps.map((step, index) => (
                      <tr key={index} className="align-top">
                        <td className="pr-2 pb-2">
                          <input
                            type="number"
                            value={step.sequenceNo}
                            onChange={(e) => updateStep(index, "sequenceNo", Number(e.target.value))}
                            className="w-full border rounded px-2 py-1.5"
                          />
                        </td>
                        <td className="pr-2 pb-2">
                          <select
                            value={step.operation}
                            onChange={(e) => updateStep(index, "operation", e.target.value)}
                            className="w-full border rounded px-2 py-1.5"
                          >
                            <option value="">Select Operation</option>
                            {operations.map((op) => (
                              <option key={op._id} value={op._id}>
                                {op.operationCode} - {op.operationName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <select
                            value={step.stage}
                            onChange={(e) => updateStep(index, "stage", e.target.value)}
                            className="w-full border rounded px-2 py-1.5"
                          >
                            <option value="Start">Start</option>
                            <option value="Middle">Middle</option>
                            <option value="End">End</option>
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <select
                            value={step.previousOperation}
                            onChange={(e) => updateStep(index, "previousOperation", e.target.value)}
                            className="w-full border rounded px-2 py-1.5"
                          >
                            <option value="">None</option>
                            {operations.map((op) => (
                              <option key={op._id} value={op._id}>
                                {op.operationCode} - {op.operationName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <select
                            value={step.type}
                            onChange={(e) => updateStep(index, "type", e.target.value)}
                            className="w-full border rounded px-2 py-1.5"
                          >
                            <option value="Scanning">Scanning</option>
                            <option value="No_Scanning">No_Scanning</option>
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <select
                            value={step.scan}
                            onChange={(e) => updateStep(index, "scan", e.target.value)}
                            className="w-full border rounded px-2 py-1.5"
                          >
                            <option value="Serial No">Serial No</option>
                            <option value="None">None</option>
                          </select>
                        </td>
                        <td className="pb-2">
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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