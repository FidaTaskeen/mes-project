import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, Trash2 } from "lucide-react";
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

const TABS = ["Active", "Draft", "Inactive", "Others"];

export default function Routing() {
  const navigate = useNavigate();
  const [routings, setRoutings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Active");

  const [filters, setFilters] = useState({
    routingCode: "",
    itemNo: "",
    description: "",
  });

  useEffect(() => {
    loadRoutings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadRoutings = async () => {
    setLoading(true);
    setError("");
    try {
      const status = tab === "Active" ? "Active" : tab === "Inactive" ? "Inactive" : undefined;
      const params = new URLSearchParams({ limit: 100 });
      if (status) params.set("status", status);
      if (filters.routingCode) params.set("search", filters.routingCode);

      const res = await axiosInstance.get(`/routings?${params.toString()}`);
      setRoutings(res.data.routings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routings");
    } finally {
      setLoading(false);
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

  // Client-side filter for item no / description
  const visibleRoutings = routings.filter((r) => {
    if (filters.itemNo && !r.item?.itemCode?.toLowerCase().includes(filters.itemNo.toLowerCase())) return false;
    if (filters.description && !r.description?.toLowerCase().includes(filters.description.toLowerCase())) return false;
    return true;
  });

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="text-sm text-slate-500 mb-1">Dashboard &gt; Masters &gt; Routing</div>
      <h1 className="text-2xl font-bold mb-5">Routing</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Routing Code</label>
            <input
              value={filters.routingCode}
              onChange={(e) => setFilters({ ...filters, routingCode: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Item No</label>
            <input
              value={filters.itemNo}
              onChange={(e) => setFilters({ ...filters, itemNo: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              value={filters.description}
              onChange={(e) => setFilters({ ...filters, description: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadRoutings}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm"
          >
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ routingCode: "", itemNo: "", description: "" });
              loadRoutings();
            }}
            className="border px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs + Create */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1 bg-white border rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/admin/routing/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Create New
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Routing Code</th>
              <th className="px-4 py-3 text-left">Item No / Platform</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Version</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created On</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
            ) : visibleRoutings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No routings found.</td></tr>
            ) : (
              visibleRoutings.map((routing) => (
                <tr key={routing._id} className="border-t">
                  <td className="px-4 py-3 font-medium text-blue-700">{routing.routingCode}</td>
                  <td className="px-4 py-3">{routing.item?.itemCode}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={routing.description}>
                    {routing.description || "—"}
                  </td>
                  <td className="px-4 py-3">{routing.version}</td>
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
                  <td className="px-4 py-3">
                    {routing.createdAt ? new Date(routing.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button
                      onClick={() => navigate(`/admin/routing/edit/${routing._id}`)}
                      className="text-blue-600"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/routing/view/${routing._id}`)}
                      className="text-slate-600"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(routing._id)}
                      className="text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
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