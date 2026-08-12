import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
  operationCode: "",
  operationName: "",
  workCenter: "",
  scanningType: "No Scan",
  routingType: "Direct Checkout",
  status: "Active",
};

export default function AdminOperations() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingOp, setEditingOp] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [filters, setFilters] = useState({
    operationCode: "",
    operationName: "",
    scanningType: "",
    status: "Active",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.operationCode || filters.operationName) {
        params.set("search", filters.operationCode || filters.operationName);
      }
      if (filters.scanningType) params.set("scanningType", filters.scanningType);
      if (filters.status) params.set("status", filters.status);
      params.set("limit", "100");

      const res = await axiosInstance.get(`/operations?${params.toString()}`);
      setOperations(res.data.operations || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddForm = () => {
    setEditingOp(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (op) => {
    setEditingOp(op);
    setForm({
      operationCode: op.operationCode,
      operationName: op.operationName,
      workCenter: op.workCenter,
      scanningType: op.scanningType || "No Scan",
      routingType: op.routingType || "Direct Checkout",
      status: op.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("DEBUG sending form:", form);
    try {
      if (editingOp) {
        const res = await axiosInstance.put(`/operations/${editingOp._id}`, form);
        console.log("DEBUG server response:", res.data);
      } else {
        const res = await axiosInstance.post("/operations", form);
        console.log("DEBUG server response:", res.data);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.log("DEBUG error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to save operation");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete this operation?")) return;
    try {
      await axiosInstance.delete(`/operations/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete operation");
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Operations</h1>
          <p className="text-slate-500 text-sm">Masters &gt; Operations</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Operation Code</label>
            <input
              value={filters.operationCode}
              onChange={(e) => setFilters({ ...filters, operationCode: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Operation Name</label>
            <input
              value={filters.operationName}
              onChange={(e) => setFilters({ ...filters, operationName: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Scanning Type</label>
            <select
              value={filters.scanningType}
              onChange={(e) => setFilters({ ...filters, scanningType: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="Scan">Scan</option>
              <option value="No Scan">No Scan</option>
            </select>
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
          <button onClick={loadData} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ operationCode: "", operationName: "", scanningType: "", status: "Active" });
              loadData();
            }}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3">Operation Code</th>
              <th className="px-4 py-3">Operation Name</th>
              <th className="px-4 py-3">Work Center</th>
              <th className="px-4 py-3">Scanning Type</th>
              <th className="px-4 py-3">Routing Type</th>
              <th className="px-4 py-3">Created On</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : operations.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">No operations found.</td></tr>
            ) : (
              operations.map((op) => (
                <tr key={op._id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{op.operationCode}</td>
                  <td className="px-4 py-3">{op.operationName}</td>
                  <td className="px-4 py-3">{op.workCenter}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        op.scanningType === "Scan" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {op.scanningType || "No Scan"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{op.routingType}</td>
                  <td className="px-4 py-3">
                    {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(op)}
                        className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(op._id)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingOp ? "Edit Operation" : "Add Operation"}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Operation Code</label>
                <input
                  value={form.operationCode}
                  onChange={(e) => setForm({ ...form, operationCode: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operation Name</label>
                <input
                  value={form.operationName}
                  onChange={(e) => setForm({ ...form, operationName: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work Center</label>
                <input
                  value={form.workCenter}
                  onChange={(e) => setForm({ ...form, workCenter: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scanning Type</label>
                <select
                  value={form.scanningType}
                  onChange={(e) => setForm({ ...form, scanningType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Scan">Scan</option>
                  <option value="No Scan">No Scan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Routing Type</label>
                <select
                  value={form.routingType}
                  onChange={(e) => setForm({ ...form, routingType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Direct Checkout">Direct Checkout</option>
                  <option value="Check In/Out">Check In/Out</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
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