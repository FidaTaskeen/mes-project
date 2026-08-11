import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Job Order", path: "/supervisor/job-order-list" },
      { label: "Traceability", path: "/supervisor/traceability" },
    ],
  },
];

const stepStatusColors = {
  Completed: "bg-green-100 text-green-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Pending: "bg-slate-200 text-slate-500",
};

export default function JobOrderDetails() {
  const { jobOrderNo: id } = useParams(); // route param, actually the Job Order's Mongo _id
  const [jobOrder, setJobOrder] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [joRes, logsRes] = await Promise.all([
        axiosInstance.get(`/joborders/${id}`),
        axiosInstance.get(`/scanlogs?jobOrder=${id}&limit=1000`),
      ]);
      setJobOrder(joRes.data.jobOrder);
      setScanLogs(logsRes.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const markComplete = async () => {
    setUpdating(true);
    try {
      await axiosInstance.put(`/joborders/${id}`, { status: "Completed" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
        <p className="text-slate-400 text-sm">Loading...</p>
      </Layout>
    );
  }

  if (error || !jobOrder) {
    return (
      <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error || "Job order not found"}</div>
      </Layout>
    );
  }

  const steps = jobOrder.routing?.steps || [];

  // For each routing step/station, count Pass scans logged against that operation for this job order
  const stationRows = steps.map((step) => {
    const opId = step.operation?._id || step.operation;
    const passCount = scanLogs.filter(
      (l) => (l.operation?._id || l.operation) === opId && l.status === "Pass"
    ).length;

    let status = "Pending";
    if (passCount >= jobOrder.quantity) status = "Completed";
    else if (passCount > 0) status = "In Progress";

    return {
      sequenceNo: step.sequenceNo,
      operationName: step.operation?.operationName || "—",
      operationCode: step.operation?.operationCode || "—",
      type: step.type,
      scannedQty: passCount,
      status,
    };
  });

  const scanTimes = scanLogs.map((l) => new Date(l.createdAt).getTime());
  const actualStart = scanTimes.length ? new Date(Math.min(...scanTimes)) : null;
  const actualEnd = jobOrder.status === "Completed" && scanTimes.length ? new Date(Math.max(...scanTimes)) : null;

  const progressPercent =
    jobOrder.quantity > 0 ? Math.round((jobOrder.completedQuantity / jobOrder.quantity) * 100) : 0;

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <Link to="/supervisor/job-order-list" className="text-sm text-green-700 hover:underline">
        ← Back to Job Order List
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Main: stations table */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold mb-1">{jobOrder.jobOrderNo}</h1>
          <p className="text-slate-500 text-sm mb-5">
            {jobOrder.item?.itemCode} — {jobOrder.item?.name}
          </p>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

          <div className="bg-white rounded-xl border overflow-hidden mb-6">
            <div className="px-4 py-3 border-b font-semibold text-sm">Stations</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Station</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Routing Ref</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Scanned Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {stationRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No routing steps found.</td></tr>
                ) : (
                  stationRows.map((row) => (
                    <tr key={row.sequenceNo} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.operationName}</td>
                      <td className="px-4 py-3 text-slate-500">{row.operationCode} · {row.type}</td>
                      <td className="px-4 py-3">{jobOrder.routing?.routingCode}</td>
                      <td className="px-4 py-3">{jobOrder.quantity}</td>
                      <td className="px-4 py-3">{row.scannedQty}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${stepStatusColors[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panel */}
        <div className="bg-white rounded-xl border p-5 h-fit">
          <div className="text-center mb-5">
            <div className="text-3xl font-bold text-green-600">{progressPercent}%</div>
            <div className="text-xs text-slate-400">
              {jobOrder.status === "Completed" ? "JO COMPLETED" : "COMPLETION"}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-400">Job Order #</div>
              <div className="font-medium">{jobOrder.jobOrderNo}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Item</div>
              <div className="font-medium">{jobOrder.item?.itemCode} — {jobOrder.item?.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Created By</div>
              <div className="font-medium">{jobOrder.createdBy?.name || jobOrder.createdBy?.userId || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Created On</div>
              <div className="font-medium">{new Date(jobOrder.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Planned Start</div>
              <div className="font-medium">{new Date(jobOrder.startDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Planned End (Due)</div>
              <div className="font-medium">{new Date(jobOrder.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Actual Start</div>
              <div className="font-medium">{actualStart ? actualStart.toLocaleString() : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Actual End</div>
              <div className="font-medium">{actualEnd ? actualEnd.toLocaleString() : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Quantity / Produced</div>
              <div className="font-medium">{jobOrder.quantity} / {jobOrder.completedQuantity}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Status</div>
              <div className="font-medium">{jobOrder.status}</div>
            </div>
          </div>

          <button
            onClick={markComplete}
            disabled={updating || jobOrder.status === "Completed"}
            className="w-full mt-5 bg-green-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {jobOrder.status === "Completed" ? "Completed" : updating ? "Updating..." : "Complete"}
          </button>
        </div>
      </div>
    </Layout>
  );
}