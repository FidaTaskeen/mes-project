import { useState, useEffect } from "react";
import { Pencil, Trash2, Eye, ArrowLeft } from "lucide-react";
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

// Preferred display order for operations (matches standard SMT line sequence)
const OPERATION_ORDER = [
  "LOAD", "SPI", "AOI", "UNLOAD", "MANIN", "PWI", "DEPANEL", "VI", "FT", "DQC", "PACK",
];

const orderIndex = (op) => {
  const idx = OPERATION_ORDER.findIndex((code) => op.operationCode?.toUpperCase().includes(code));
  return idx === -1 ? 999 : idx;
};

const emptyForm = {
  routingCode: "",
  bom: "",
  version: "Version 1",
  status: "Active",
  description: "",
  steps: [],
};

export default function Routing() {
  const [routings, setRoutings] = useState([]);
  const [boms, setBoms] = useState([]);
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Active");

  // view mode: "list" | "form" | "detail"
  const [view, setView] = useState("list");
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
      const sortedOps = (opsRes.data.operations || []).slice().sort((a, b) => orderIndex(a) - orderIndex(b));
      setOperations(sortedOps);
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
    setView("form");
  };

  const openEditForm = (routing) => {
    setEditingRouting(routing);
    setForm({
      routingCode: routing.routingCode,
      bom: routing.bom?._id || routing.bom || "",
      version: routing.version || "Version 1",
      status: routing.status,
      description: routing.description || "",
      steps: routing.steps
        .slice()
        .sort((a, b) => a.sequenceNo - b.sequenceNo)
        .map((s) => ({
          operation: s.operation?._id || s.operation,
          standardTime: s.standardTime,
        })),
    });
    setView("form");
  };

  const openDetail = (routing) => {
    setViewingRouting(routing);
    setView("detail");
  };

  const backToList = () => {
    setView("list");
    setEditingRouting(null);
    setViewingRouting(null);
  };

  const toggleOperationInSteps = (opId) => {
    setForm((f) => {
      const exists = f.steps.find((s) => s.operation === opId);
      if (exists) {
        return { ...f, steps: f.steps.filter((s) => s.operation !== opId) };
      }
      const op = operations.find((o) => o._id === opId);
      return { ...f, steps: [...f.steps, { operation: opId, standardTime: op?.standardTime || 5 }] };
    });
  };

  const moveStep = (index, direction) => {
    setForm((f) => {
      const steps = [...f.steps];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= steps.length) return f;
      [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
      return { ...f, steps };
    });
  };

  const removeStep = (index) => {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }));
  };

  const addAllOperationsInOrder = () => {
    const steps = operations.map((op) => ({ operation: op._id, standardTime: op.standardTime || 5 }));
    setForm((f) => ({ ...f, steps }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.steps.length === 0) {
      setError("Add at least one operation to the routing.");
      return;
    }
    const payload = {
      ...form,
      steps: form.steps.map((s, i) => ({
        operation: s.operation,
        sequenceNo: i + 1,
        standardTime: Number(s.standardTime) || 5,
      })),
    };
    try {
      if (editingRouting) {
        await axiosInstance.put(`/routings/${editingRouting._id}`, payload);
      } else {
        await axiosInstance.post("/routings", payload);
      }
      backToList();
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

  // ---------- LIST VIEW ----------
  if (view === "list") {
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
                          onClick={() => openDetail(routing)}
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
      </Layout>
    );
  }

  // ---------- DETAIL (VIEW) — read-only, distinct look from the form ----------
  if (view === "detail" && viewingRouting) {
    return (
      <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
        <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
          <ArrowLeft size={14} /> Back to Routing List
        </button>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold">{viewingRouting.routingCode}</h1>
              <p className="text-slate-500 text-sm">{itemName(viewingRouting.item)}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                viewingRouting.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : viewingRouting.status === "Draft"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {viewingRouting.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-slate-400 text-xs">BOM</p>
              <p className="font-medium">{bomLabel(viewingRouting.bom)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Version</p>
              <p className="font-medium">{viewingRouting.version}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Operations</p>
              <p className="font-medium">{viewingRouting.steps.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Created On</p>
              <p className="font-medium">
                {viewingRouting.createdAt ? new Date(viewingRouting.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
          {viewingRouting.description && (
            <div className="mt-3 text-sm">
              <p className="text-slate-400 text-xs">Description</p>
              <p>{viewingRouting.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-3 border-b font-medium text-sm">Operation Sequence</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-2 w-16">S.No</th>
                <th className="px-4 py-2">Operation</th>
                <th className="px-4 py-2">Work Center</th>
                <th className="px-4 py-2">Standard Time</th>
              </tr>
            </thead>
            <tbody>
              {viewingRouting.steps
                .slice()
                .sort((a, b) => a.sequenceNo - b.sequenceNo)
                .map((s, i) => {
                  const op = typeof s.operation === "object" ? s.operation : operations.find((o) => o._id === s.operation);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center justify-center">
                          {s.sequenceNo}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium">
                        {op ? `${op.operationCode} - ${op.operationName}` : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-500">{op?.workCenter || "—"}</td>
                      <td className="px-4 py-2 text-slate-500">{s.standardTime} min</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Layout>
    );
  }

  // ---------- FULL-PAGE CREATE/EDIT FORM ----------
  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowLeft size={14} /> Back to Routing List
      </button>

      <h1 className="text-xl font-bold mb-5">{editingRouting ? "Edit Routing" : "Create Routing"}</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium">Select Operations (in order)</h2>
            <button
              type="button"
              onClick={addAllOperationsInOrder}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              + Add All Operations In Order
            </button>
          </div>

          {/* Available operations to pick from, pre-sorted in standard sequence */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
            {operations.map((op) => {
              const selected = form.steps.some((s) => s.operation === op._id);
              return (
                <button
                  type="button"
                  key={op._id}
                  onClick={() => toggleOperationInSteps(op._id)}
                  className={`text-left border rounded-lg px-3 py-2 text-sm ${
                    selected ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:border-slate-300"
                  }`}
                >
                  {op.operationCode} - {op.operationName}
                </button>
              );
            })}
          </div>

          {/* Selected steps, auto-numbered by order */}
          <h3 className="text-sm font-medium mb-2">Routing Sequence ({form.steps.length} operations)</h3>
          {form.steps.length === 0 ? (
            <p className="text-sm text-slate-400">No operations selected yet — click above to add.</p>
          ) : (
            <div className="space-y-2">
              {form.steps.map((step, index) => {
                const op = operations.find((o) => o._id === step.operation);
                return (
                  <div key={index} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                    <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm">{op ? `${op.operationCode} - ${op.operationName}` : "—"}</span>
                    <input
                      type="number"
                      value={step.standardTime}
                      onChange={(e) => {
                        const steps = [...form.steps];
                        steps[index].standardTime = e.target.value;
                        setForm({ ...form, steps });
                      }}
                      className="w-20 border rounded px-2 py-1 text-sm"
                      title="Standard time (min)"
                    />
                    <button type="button" onClick={() => moveStep(index, -1)} className="text-slate-400 hover:text-slate-700 text-sm px-1">↑</button>
                    <button type="button" onClick={() => moveStep(index, 1)} className="text-slate-400 hover:text-slate-700 text-sm px-1">↓</button>
                    <button type="button" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 text-sm px-1">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={backToList} className="px-4 py-2 text-sm text-slate-600">
            Cancel
          </button>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Save Routing
          </button>
        </div>
      </form>
    </Layout>
  );
}