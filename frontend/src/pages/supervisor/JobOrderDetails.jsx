import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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

const stationStatusStyle = {
  Completed: "bg-green-100 text-green-700",
  InProgress: "bg-blue-100 text-blue-700",
  Open: "bg-slate-200 text-slate-500",
};

export default function JobOrderDetails() {
  const { jobOrderNo: id } = useParams();
  const [jobOrder, setJobOrder] = useState(null);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const routing = jobOrder.routing || {};
  const allSteps = [...(routing.steps || [])].sort((a, b) => a.sequenceNo - b.sequenceNo);

  const firstOpId = routing.firstScanOperation?._id || routing.firstScanOperation;
  const lastOpId = routing.lastScanOperation?._id || routing.lastScanOperation;

  const firstStep = allSteps.find((s) => (s.operation?._id || s.operation) === firstOpId);
  const lastStep = allSteps.find((s) => (s.operation?._id || s.operation) === lastOpId);

  const steps =
    firstStep && lastStep
      ? allSteps.filter((s) => s.sequenceNo >= firstStep.sequenceNo && s.sequenceNo <= lastStep.sequenceNo)
      : allSteps;

  const stationRows = steps.map((step) => {
    const opId = step.operation?._id || step.operation;
    const scannedQty = scanLogs.filter(
      (l) => (l.operation?._id || l.operation) === opId && l.status === "Pass"
    ).length;

    let status = "Open";
    if (scannedQty >= jobOrder.quantity) status = "Completed";
    else if (scannedQty > 0) status = "InProgress";

    return {
      sequenceNo: step.sequenceNo,
      stationCode: step.operation?.operationCode || "—",
      operationName: step.operation?.operationName || "—",
      routingType: step.operation?.routingType || "—",
      scanType: step.type,
      stage: step.stage,
      scannedQty,
      status,
    };
  });

  const scanningCount = stationRows.filter((s) => s.scanType === "Scanning").length;
  const nonScanningCount = stationRows.filter((s) => s.scanType === "No_Scanning").length;

  const inputCount = stationRows[0]?.scannedQty ?? 0;
  const outputCount = stationRows[stationRows.length - 1]?.scannedQty ?? 0;

  const scanTimes = scanLogs.map((l) => new Date(l.createdAt).getTime());
  const actualStart = scanTimes.length ? new Date(Math.min(...scanTimes)) : null;
  const actualEnd = jobOrder.status === "Completed" && scanTimes.length ? new Date(Math.max(...scanTimes)) : null;

  const jocCompletion =
    jobOrder.quantity > 0 ? Math.round((jobOrder.completedQuantity / jobOrder.quantity) * 100) : 0;

  const progressColor = (status) => {
    if (status === "Completed") return "bg-green-500";
    if (status === "InProgress") return "bg-blue-400";
    return "bg-slate-300";
  };

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <Link to="/supervisor/job-order-list" className="text-sm text-green-700 hover:underline">
        ← Back to Job Order List
      </Link>

      <div className="mt-4 mb-1 text-sm text-slate-500">
        Dashboard &gt; {jobOrder.jobOrderNo} &gt; {jobOrder.item?.itemCode} &gt; Process
      </div>
      <h1 className="text-2xl font-bold mb-5">{jobOrder.jobOrderNo}</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                {stationRows.length} Stations in Total
              </span>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Scanning Station ({scanningCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> Non Scanning Station ({nonScanningCount})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-2">
              {stationRows.map((s, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded ${progressColor(s.status)}`} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              {stationRows.map((s, i) => (
                <span key={i} className="truncate">{s.stationCode}</span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">#</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Station</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Routing Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Scanned Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {stationRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No routing steps found.</td></tr>
                ) : (
                  stationRows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${row.scanType === "Scanning" ? "bg-green-500" : "bg-slate-300"}`} />
                        {row.stationCode}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.operationName}</td>
                      <td className="px-4 py-3 text-slate-500">{row.routingType}</td>
                      <td className="px-4 py-3">{row.scannedQty}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${stationStatusStyle[row.status]}`}>
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

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="grid grid-cols-3 items-center gap-3">
              <div className="col-span-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center text-lg font-bold text-green-600">
                  {jocCompletion}%
                </div>
                <div className="text-xs text-slate-400 mt-1">JO Completion</div>
              </div>
              <div className="col-span-1 text-center border-l">
                <div className="text-xs text-slate-400">Input Count</div>
                <div className="text-xl font-bold">{inputCount}</div>
                <div className="text-xs text-slate-400">({stationRows[0]?.stationCode || "—"})</div>
              </div>
              <div className="col-span-1 text-center border-l">
                <div className="text-xs text-slate-400">Output Count</div>
                <div className="text-xl font-bold">{outputCount}</div>
                <div className="text-xs text-slate-400">({stationRows[stationRows.length - 1]?.stationCode || "—"})</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-bold text-lg">{jobOrder.jobOrderNo}</div>
                <div className="text-xs text-slate-400">
                  {jobOrder.item?.itemCode} — {jobOrder.item?.name}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  jobOrder.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : jobOrder.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : jobOrder.status === "On Hold"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {jobOrder.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
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
                <div className="text-xs text-slate-400">Planned End</div>
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
                <div className="text-xs text-slate-400">Line</div>
                <div className="font-medium">{stationRows[0]?.stationCode ? stationRows.find(s => s.status !== "Completed")?.stationCode || "Complete" : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Quantity / Produced</div>
                <div className="font-medium">{jobOrder.quantity} / {jobOrder.completedQuantity}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">First Scan Operation</div>
                <div className="font-medium">
                  {routing.firstScanOperation
                    ? `${routing.firstScanOperation.operationCode} - ${routing.firstScanOperation.operationName}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Routing / Version</div>
                <div className="font-medium">
                  {routing.routingCode || "—"} ({jobOrder.routingVersion || routing.version || "—"})
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Last Scan Operation</div>
                <div className="font-medium">
                  {routing.lastScanOperation
                    ? `${routing.lastScanOperation.operationCode} - ${routing.lastScanOperation.operationName}`
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}