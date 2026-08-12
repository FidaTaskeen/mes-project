import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

const FIXED_OPERATION_ORDER = [
  "loading", "spi", "aoi", "unloading", "manual insertion",
  "post wave inspection", "depanelling", "visual inspection",
  "functional testing", "oqc", "packing",
];

const sortByFixedOrder = (ops) => {
  const rank = (op) => {
    const name = (op.operationName || "").toLowerCase().trim();
    const idx = FIXED_OPERATION_ORDER.indexOf(name);
    return idx === -1 ? FIXED_OPERATION_ORDER.length : idx;
  };
  return [...ops].sort((a, b) => rank(a) - rank(b));
};

const deriveLineFields = (operation) => {
  if (operation?.scanningType === "Scan") {
    return { type: "Scanning", scan: "Serial No" };
  }
  return { type: "No_Scanning", scan: "None" };
};

const emptyForm = {
  routingCode: "",
  bom: "",
  status: "Active",
  version: "Version 1",
  description: "",
  firstScanOperation: "",
  lastScanOperation: "",
  steps: [],
};

export default function RoutingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [boms, setBoms] = useState([]);
  const [items, setItems] = useState([]);
  const [operations, setOperations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBoms();
    loadItems();
    loadOperations();
    if (isEditing) loadExisting();
    else generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const generateCode = async () => {
    try {
      const res = await axiosInstance.get("/routings?limit=100");
      const next = (res.data.routings || []).length + 1;
      setForm((f) => ({ ...f, routingCode: `RT-${String(next).padStart(3, "0")}` }));
    } catch {
      setForm((f) => ({ ...f, routingCode: `RT-001` }));
    }
  };

  const loadExisting = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/routings?limit=100");
      const routing = (res.data.routings || []).find((r) => r._id === id);
      if (!routing) {
        setError("Routing not found");
        return;
      }
      setForm({
        routingCode: routing.routingCode,
        bom: routing.bom?._id || routing.bom,
        status: routing.status,
        version: routing.version || "Version 1",
        description: routing.description || "",
        firstScanOperation: routing.firstScanOperation?._id || routing.firstScanOperation || "",
        lastScanOperation: routing.lastScanOperation?._id || routing.lastScanOperation || "",
        steps: routing.steps.map((s) => ({
          operation: s.operation?._id || s.operation,
          stage: s.stage || "Middle",
          type: s.type || "No_Scanning",
          scan: s.scan || "None",
        })),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routing");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (bomId) => {
    const bom = boms.find((b) => b._id === bomId);
    const item = items.find((i) => i._id === (bom?.parentItem?._id || bom?.parentItem));
    setForm({ ...form, bom: bomId, description: item?.description || "" });
  };

  const addAllOperations = () => {
    const ordered = sortByFixedOrder(operations);
    const steps = ordered.map((op, index) => ({
      operation: op._id,
      stage: index === 0 ? "Start" : index === ordered.length - 1 ? "End" : "Middle",
      ...deriveLineFields(op),
    }));
    setForm({ ...form, steps });
  };

  const addStep = () => {
    setForm({
      ...form,
      steps: [
        ...form.steps,
        { operation: "", stage: "Middle", type: "No_Scanning", scan: "None" },
      ],
    });
  };

  const updateStep = (index, field, value) => {
    const updated = [...form.steps];
    updated[index][field] = value;

    // Type and Scan are always auto-derived from the selected Operation's Scanning Type
    // in Operations master - never manually editable here.
    if (field === "operation") {
      const op = operations.find((o) => o._id === value);
      Object.assign(updated[index], deriveLineFields(op));
    }

    setForm({ ...form, steps: updated });
  };

  const removeStep = (index) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstScanOperation || !form.lastScanOperation) {
      setError("First Scan Operation and Last Scan Operation are both mandatory");
      return;
    }
    if (form.steps.length === 0) {
      setError("Add at least one routing line before saving");
      return;
    }
    const emptyLine = form.steps.findIndex((s) => !s.operation);
    if (emptyLine !== -1) {
      setError(`Routing line ${emptyLine + 1} has no Operation selected`);
      return;
    }

    setSaving(true);
    try {
      // Re-derive type/scan from current Operations master right before saving,
      // so the routing always reflects the latest Scanning Type - never stale.
      const steps = form.steps.map((s, i) => {
        const op = operations.find((o) => o._id === s.operation);
        return { ...s, ...deriveLineFields(op), sequenceNo: (i + 1) * 10 };
      });
      const payload = { ...form, steps };

      if (isEditing) {
        await axiosInstance.put(`/routings/${id}`, payload);
      } else {
        await axiosInstance.post("/routings", payload);
      }
      navigate("/admin/routing");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save routing");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
        <p className="text-slate-400 text-sm">Loading...</p>
      </Layout>
    );
  }

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <button
        onClick={() => navigate("/admin/routing")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={14} /> Back to Routing Master
      </button>

      <div className="text-sm text-slate-500 mb-1">
        Dashboard &gt; Masters &gt; Routing &gt; {isEditing ? "Update" : "Create"}
      </div>
      <h1 className="text-xl font-bold mb-5">Routing - Header</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium mb-1">Routing Code</label>
            <input value={form.routingCode} readOnly className="w-full border rounded px-3 py-2 bg-slate-100" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Item No</label>
            <select
              value={form.bom}
              onChange={(e) => handleItemChange(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Item</option>
              {boms.map((bom) => (
                <option key={bom._id} value={bom._id}>
                  {bom.parentItem?.itemCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              readOnly
              placeholder="Auto-filled from the selected Item"
              className="w-full border rounded px-3 py-2 bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              First Scan Operation <span className="text-red-500">*</span>
            </label>
            <select
              value={form.firstScanOperation}
              onChange={(e) => setForm({ ...form, firstScanOperation: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Operation</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last Scan Operation <span className="text-red-500">*</span>
            </label>
            <select
              value={form.lastScanOperation}
              onChange={(e) => setForm({ ...form, lastScanOperation: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Operation</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
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
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Routing Lines ({form.steps.length})</h3>
            <div className="flex gap-3">
              <button type="button" onClick={addAllOperations} className="text-blue-600 text-sm font-medium">
                + Add All Active Operations (TVSE order)
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
                  <th className="pb-2 pr-2 min-w-[180px]">Operation</th>
                  <th className="pb-2 pr-2 w-28">Stage</th>
                  <th className="pb-2 pr-2 w-36">Type</th>
                  <th className="pb-2 pr-2 w-28">Scan</th>
                  <th className="pb-2 w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {form.steps.map((step, index) => (
                  <tr key={index} className="align-top">
                    <td className="pr-2 pb-2">
                      <select
                        value={step.operation}
                        onChange={(e) => updateStep(index, "operation", e.target.value)}
                        className="w-full border rounded px-2 py-1.5"
                      >
                        <option value="">Select Operation</option>
                        {operations.map((op) => (
                          <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
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
                      <span
                        className={`inline-block px-2 py-1.5 rounded text-xs w-full text-center ${
                          step.type === "Scanning"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        title="Auto-set from the Operation's Scanning Type in Operations master"
                      >
                        {step.type}
                      </span>
                    </td>
                    <td className="pr-2 pb-2">
                      <span
                        className="inline-block px-2 py-1.5 rounded text-xs w-full text-center bg-slate-100 text-slate-500"
                        title="Auto-set from the Operation's Scanning Type in Operations master"
                      >
                        {step.scan}
                      </span>
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
          <button type="button" onClick={() => navigate("/admin/routing")} className="px-4 py-2 text-slate-600">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Save Routing"}
          </button>
        </div>
      </form>
    </Layout>
  );
}