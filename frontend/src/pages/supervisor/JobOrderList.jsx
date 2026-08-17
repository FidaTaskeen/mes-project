import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pencil, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Dashboard", path: "/supervisor/dashboard" },
      { label: "Job Order", path: "/supervisor/job-order-list" },
      { label: "Traceability", path: "/supervisor/traceability" },
    ],
  },
];

const emptyForm = {
  item: "",
  routing: "",
  quantity: "",
  startDate: "",
  dueDate: "",
  remarks: "",
};

export default function JobOrderList() {
  const [jobOrders, setJobOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [routings, setRoutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const [filters, setFilters] = useState({
    jobOrderNo: "",
    itemNo: "",
    status: "",
    date: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingJO, setEditingJO] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.jobOrderNo) params.set("search", filters.jobOrderNo);
      if (filters.itemNo) params.set("itemQuery", filters.itemNo);
      if (filters.status) params.set("status", filters.status);
      if (filters.date) params.set("date", filters.date);
      params.set("limit", "100");

      const [joRes, itemsRes] = await Promise.all([
        axiosInstance.get(`/joborders?${params.toString()}`),
        axiosInstance.get("/items?limit=100"),
      ]);
      setJobOrders(joRes.data.jobOrders || []);
      setItems(itemsRes.data.items || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoutingsForItem = async (itemId) => {
    if (!itemId) {
      setRoutings([]);
      return;
    }
    try {
      const res = await axiosInstance.get(`/routings?item=${itemId}&limit=50`);
      setRoutings(res.data.routings || []);
    } catch {
      setRoutings([]);
    }
  };

  const openAddForm = () => {
    setEditingJO(null);
    setForm(emptyForm);
    setRoutings([]);
    setShowForm(true);
  };

  const openEditForm = async (jo) => {
    setEditingJO(jo);
    setForm({
      item: jo.item?._id || "",
      routing: jo.routing?._id || "",
      quantity: jo.quantity,
      startDate: jo.startDate ? jo.startDate.slice(0, 10) : "",
      dueDate: jo.dueDate ? jo.dueDate.slice(0, 10) : "",
      remarks: jo.remarks || "",
    });
    await loadRoutingsForItem(jo.item?._id);
    setShowForm(true);
  };

  const handleItemChange = (itemId) => {
    setForm({ ...form, item: itemId, routing: "" });
    loadRoutingsForItem(itemId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingJO) {
        await axiosInstance.put(`/joborders/${editingJO._id}`, form);
      } else {
        await axiosInstance.post("/joborders", form);
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save job order");
    }
  };

  const setStatus = async (jo, status) => {
    setError("");
    try {
      await axiosInstance.put(`/joborders/${jo._id}`, { status });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (jo) => {
    if (!window.confirm(`Delete ${jo.jobOrderNo}? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/joborders/${jo._id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete job order");
    }
  };

  const statusBadge = (status) => {
    const dotColors = {
      Planned: "bg-slate-400",
      Released: "bg-blue-500",
      "On Hold": "bg-amber-500",
      "In Progress": "bg-indigo-500",
      Completed: "bg-green-500",
    };
    const textColors = {
      Planned: "text-slate-600",
      Released: "text-blue-700",
      "On Hold": "text-amber-700",
      "In Progress": "text-indigo-700",
      Completed: "text-green-700",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColors[status] || "text-slate-600"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || "bg-slate-400"}`} />
        {status === "In Progress" ? "InProgress" : status}
      </span>
    );
  };

  const selectedRouting = routings.find((r) => r._id === form.routing);

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Job Order</h1>
        <button
          onClick={openAddForm}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          + Create Job Order
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Job Order No.</label>
            <input
              value={filters.jobOrderNo}
              onChange={(e) => setFilters({ ...filters, jobOrderNo: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item No.</label>
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
              <option value="Planned">Planned</option>
              <option value="Released">Released</option>
              <option value="On Hold">On Hold</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
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
              setFilters({ jobOrderNo: "", itemNo: "", status: "", date: "" });
              loadData();
            }}
            className="border px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Job No.</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item No.</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Item No. - Description</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Produced Qty</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Due Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Routing Version</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : jobOrders.length === 0 ? (
              <tr><td colSpan="9" className="px-4 py-6 text-center text-slate-400">No job orders found.</td></tr>
            ) : (
              jobOrders.map((jo) => (
                <tr key={jo._id} className="border-t hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 font-medium text-green-700">
                    <Link to={`/supervisor/job-order-details/${jo._id}`} className="hover:underline">
                      {jo.jobOrderNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{jo.item?.itemCode}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <button
                      onClick={() => setExpandedRow(expandedRow === jo._id ? null : jo._id)}
                      className="text-left"
                    >
                      <span className={expandedRow === jo._id ? "" : "line-clamp-1"}>
                        {jo.item?.itemCode} - {jo.item?.name}
                        {expandedRow === jo._id && jo.item?.description && (
                          <span className="block text-xs text-slate-400 mt-1 line-clamp-3">{jo.item.description}</span>
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">{jo.quantity}</td>
                  <td className="px-4 py-3">{jo.completedQuantity}</td>
                  <td className="px-4 py-3">{new Date(jo.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(jo.status)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {jo.routing?.version || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(jo)}
                        className="w-7 h-7 rounded bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setStatus(jo, jo.status === "On Hold" ? "Released" : "On Hold")}
                        disabled={jo.status === "Completed"}
                        className={`w-7 h-7 rounded flex items-center justify-center ${
                          jo.status === "On Hold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600"
                        } disabled:opacity-40`}
                        title={jo.status === "On Hold" ? "Currently paused - click to resume" : "Pause"}
                      >
                        {jo.status === "On Hold" ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(jo)}
                        className="w-7 h-7 rounded bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
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
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingJO ? "Edit Job Order" : "Create Job Order"}</h2>

            <label className="block text-sm font-medium mb-1">Item No.</label>
            <select
              value={form.item}
              onChange={(e) => handleItemChange(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 mb-3"
            >
              <option value="">-- Select Item --</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.itemCode} - {item.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-1">Routing</label>
            <select
              value={form.routing}
              onChange={(e) => setForm({ ...form, routing: e.target.value })}
              required
              disabled={!form.item}
              className="w-full border rounded-lg px-3 py-2 mb-1 disabled:bg-slate-50"
            >
              <option value="">-- Select Routing --</option>
              {routings.map((r) => (
                <option key={r._id} value={r._id}>{r.routingCode}</option>
              ))}
            </select>
            {selectedRouting && (
              <p className="text-xs text-slate-500 mb-3">
                Routing Version: <span className="font-medium text-slate-700">{selectedRouting.version}</span>
              </p>
            )}
            {!selectedRouting && <div className="mb-3" />}

            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
              className="w-full border rounded-lg px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">Remarks</label>
            <input
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600">
                Cancel
              </button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}