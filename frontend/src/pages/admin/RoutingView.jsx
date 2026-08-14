import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
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

const opLabel = (op) => (op ? `${op.operationCode} - ${op.operationName}` : "—");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

export default function RoutingView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [routing, setRouting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/routings?limit=100");
      const found = (res.data.routings || []).find((r) => r._id === id);
      if (!found) {
        setError("Routing not found");
      } else {
        setRouting(found);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load routing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <button
        onClick={() => navigate("/admin/routing")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mb-4"
      >
        <ArrowLeft size={14} /> Back to Routing Master
      </button>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="text-xl font-bold text-blue-700">{routing.routingCode}</h1>
              <p className="text-slate-500 text-sm">
                {routing.item?.itemCode} — {routing.item?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded text-xs h-fit ${
                  routing.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                }`}
              >
                {routing.status}
              </span>
              <button
                onClick={() => navigate(`/admin/routing/edit/${routing._id}`)}
                className="flex items-center gap-1 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 text-sm">
            <div className="col-span-2 md:col-span-3">
              <div className="text-slate-400 text-xs">Description</div>
              <div className="font-medium">{routing.description || "—"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Version</div>
              <div className="font-medium">{routing.version || "—"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">First Scan Operation</div>
              <div className="font-medium">{opLabel(routing.firstScanOperation)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Last Scan Operation</div>
              <div className="font-medium">{opLabel(routing.lastScanOperation)}</div>
            </div>
          </div>

          <h3 className="font-semibold mb-2 text-sm">Routing Lines</h3>
          <div className="border rounded-lg overflow-x-auto mb-6">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Operation</th>
                  <th className="px-3 py-2 text-left">Stage</th>
                  <th className="px-3 py-2 text-left">Previous Operation</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Scan</th>
                </tr>
              </thead>
              <tbody>
                {routing.steps?.map((s, i) => (
                  <tr key={i} className="border-t">
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

          <h3 className="font-semibold mb-2 text-sm">Administration Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
            <div>
              <div className="text-slate-400 text-xs">Created By</div>
              <div className="font-medium">{routing.createdBy?.name || routing.createdBy?.userId || "—"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Created On</div>
              <div className="font-medium">{fmtDate(routing.createdAt)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Changed By</div>
              <div className="font-medium">{routing.updatedBy?.name || routing.updatedBy?.userId || "—"}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Changed On</div>
              <div className="font-medium">{fmtDate(routing.updatedAt)}</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}