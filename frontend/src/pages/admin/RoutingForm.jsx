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
  "loading",
  "spi",
  "aoi",
  "unloading",
  "manual insertion",
  "post wave inspection",
  "depanelling",
  "visual inspection",
  "functional testing",
  "dqc",
  "packing",
];

const sortByFixedOrder = (ops) => {
  const rank = (op) => {
    const name = (op.operationName || "").toLowerCase().trim();
    const idx = FIXED_OPERATION_ORDER.indexOf(name);
    return idx === -1 ? FIXED_OPERATION_ORDER.length : idx;
  };
  return [...ops].sort((a, b) => rank(a) - rank(b));
};

const emptyForm = {
  routingCode: "",
  bom: "",
  status: "Active",
  description: "",
  firstScanningOperation: "",
  lastScanOperation: "",
  steps: [],
};

export default function RoutingForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [boms, setBoms] = useState([]);
  const [operations, setOperations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBoms();
    loadOperations();
    if (isEditing) loadExisting();
    else generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        description: routing.description || "",
        firstScanningOperation: routing.firstScanningOperation?._id || "",
        lastScanOperation: routing.lastScanOperation?._id || "",
        steps: routing.steps.map((s) => ({
          operation: s.operation?._id || s.operation,
          stage: s.stage || "Middle",
          previousOperation: s.previousOperation?._id || s.previousOperation || "",
          type: s.type || "No_Scanning",
          scan: s.scan || "None",
          standardTime: s.standardTime || 0,
        })),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routing");
    } finally {
      setLoading(false);
    }
  };

  const addAllOperations = () => {
    const ordered = sortByFixedOrder(operations);
    const steps = ordered.map((op, index) => ({
      operation: op._id,
      stage: index === 0 ? "Start" : index === ordered.length - 1 ? "End" : "Middle",
      previousOperation: index === 0 ? "" : ordered[index - 1]._id,
      type: index === 0 ? "Scanning" : "No_Scanning",
      scan: index === 0 ? "Serial No" : "None",
      standardTime: op.standardTime || 0,
    }));
    setForm({ ...form, steps });
  };

  const addStep = () => {
    setForm({
      ...form,
      steps: [
        ...form.steps,
        {
          operation: "",
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

  const buildPayload = () => {
    const steps = form.steps.map((s, i) => {
      const step = { ...s, sequenceNo: (i + 1) * 10 };
      if (!step.previousOperation) delete step.previousOperation;
      return step;
    });
    return { ...form, steps };
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      const payload = buildPayload();
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

      <h1 className="text-lg font-semibold text-slate-500 mb-1">
        Dashboard &gt; Masters &gt; Routing &gt; {isEditing ? "Update" : "Create"}
      </h1>
      <h2 className="text-xl font-bold mb-5">Routing - Header</h2>

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
              onChange={(e) => setForm({ ...form, bom: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Item</option>
              {boms.map((bom) => (
                <option key={bom._id} value={bom._id}>
                  {bom.parentItem?.itemCode} - {bom.parentItem?.name} (BOM: {bom.bomCode})
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
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="col-span-2 md:col-span-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">First Scan Operation</label>
            <select
              value={form.firstScanningOperation}
              onChange={(e) => setForm({ ...form, firstScanningOperation: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">None</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Scan Operation</label>
            <select
              value={form.lastScanOperation}
              onChange={(e) => setForm({ ...form, lastScanOperation: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">None</option>
              {operations.map((op) => (
                <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
              ))}
            </select>
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
                  <th className="pb-2 pr-2 min-w-[180px]">Previous Operation</th>
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
                      <select
                        value={step.previousOperation}
                        onChange={(e) => updateStep(index, "previousOperation", e.target.value)}
                        className="w-full border rounded px-2 py-1.5"
                      >
                        <option value="">None</option>
                        {operations.map((op) => (
                          <option key={op._id} value={op._id}>{op.operationCode} - {op.operationName}</option>
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