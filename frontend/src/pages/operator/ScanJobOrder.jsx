import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ScanLine, Trash2 } from "lucide-react";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Operator Dashboard", path: "/operator/dashboard" },
      { label: "Scan Job Order", path: "/operator/scan" },
      { label: "My Operations", path: "/operator/my-operations" },
      { label: "Production Entry", path: "/operator/production-entry" },
      { label: "Production History", path: "/operator/history" },
      { label: "My Performance", path: "/operator/performance" },
      { label: "Traceability", path: "/operator/traceability" },
    ],
  },
];

export default function ScanJobOrder() {
  const { jobOrderId: paramJobOrderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const operationId = new URLSearchParams(location.search).get("operation");

  const [jobOrderNoInput, setJobOrderNoInput] = useState("");
  const [jobOrderId, setJobOrderId] = useState(paramJobOrderId || null);

  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [serialId, setSerialId] = useState("");
  const [scanStatus, setScanStatus] = useState("Pass");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanError, setScanError] = useState("");
  const inputRef = useRef(null);

  const [showAllLogs, setShowAllLogs] = useState(false);
  const [allLogsData, setAllLogsData] = useState([]);
  const [allLogsLoading, setAllLogsLoading] = useState(false);
  const [allLogsPage, setAllLogsPage] = useState(1);
  const [allLogsTotal, setAllLogsTotal] = useState(0);

  const loadJobOrderStatus = async (id) => {
    setLoading(true);
    setError("");
    try {
      const opQuery = operationId ? `?operation=${operationId}` : "";
      const [statusRes, logsRes] = await Promise.all([
        axiosInstance.get(`/scanlogs/job-order-status/${id}${opQuery}`),
        axiosInstance.get(`/scanlogs?jobOrder=${id}${operationId ? `&operation=${operationId}` : ""}`),
      ]);
      setStatus(statusRes.data);
      setLogs(logsRes.data.logs || []);
      setJobOrderId(id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job order");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAllLogs = async (page = 1) => {
    setAllLogsLoading(true);
    try {
      const res = await axiosInstance.get(
        `/scanlogs?jobOrder=${jobOrderId}${operationId ? `&operation=${operationId}` : ""}&page=${page}&limit=100`
      );
      setAllLogsData(res.data.logs || []);
      setAllLogsTotal(res.data.total || 0);
      setAllLogsPage(page);
    } catch (err) {
      setAllLogsData([]);
    } finally {
      setAllLogsLoading(false);
    }
  };

  useEffect(() => {
    if (paramJobOrderId) {
      loadJobOrderStatus(paramJobOrderId);
    } else if (location.state?.jobOrderNo) {
      handleManualSearch(location.state.jobOrderNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramJobOrderId, operationId]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [jobOrderId]);

  useEffect(() => {
    if (showAllLogs) loadAllLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllLogs]);

  const handleManualSearch = async (jobOrderNo) => {
    const no = jobOrderNo || jobOrderNoInput;
    if (!no) return;
    setLoading(true);
    setError("");
    try {
      const scanRes = await axiosInstance.get(`/joborders/scan/${no}`);
      await loadJobOrderStatus(scanRes.data.jobOrder._id);
    } catch (err) {
      setError(err.response?.data?.message || "Job order not found");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!serialId.trim()) return;
    if (!operationId) {
      setScanError("No operation selected. Go back to the dashboard and open this job order from an operation tile.");
      return;
    }
    const expectedLength = status?.jobOrder?.item?.serialNoLength;
    if (expectedLength && serialId.trim().length !== expectedLength) {
      setScanError(`Serial ID must be exactly ${expectedLength} characters (got ${serialId.trim().length}).`);
      return;
    }
    setScanError("");
    try {
      await axiosInstance.post("/scanlogs", {
        jobOrder: jobOrderId,
        operation: operationId,
        serialId: serialId.trim(),
        status: scanStatus,
      });
      setSerialId("");
      loadJobOrderStatus(jobOrderId);
    } catch (err) {
      setScanError(err.response?.data?.message || "Failed to record scan");
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Delete this scan? This will also adjust the job order's counts.")) return;
    try {
      await axiosInstance.delete(`/scanlogs/${logId}`);
      await loadJobOrderStatus(jobOrderId);
      if (showAllLogs) await loadAllLogs(allLogsPage);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete scan");
    }
  };

  const totalPages = Math.max(Math.ceil(allLogsTotal / 100), 1);

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      {jobOrderId && (
        <button
          onClick={() => navigate("/operator/dashboard")}
          className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
      )}

      {!jobOrderId && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-5 max-w-md">
          <label className="block text-sm font-medium mb-1">Enter Job Order No.</label>
          <div className="flex gap-2">
            <input
              value={jobOrderNoInput}
              onChange={(e) => setJobOrderNoInput(e.target.value)}
              placeholder="e.g. JO-2026-0005"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => handleManualSearch()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Search
            </button>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 max-w-md">{error}</div>}

      {loading && <p className="text-slate-500">Loading...</p>}

      {status && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">
                  {status.currentOperation?.operationCode} - {status.currentOperation?.operationName}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Job Order</p>
                    <p className="font-medium">{status.jobOrder.jobOrderNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Item No.</p>
                    <p className="font-medium">{status.jobOrder.item?.itemCode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Item Description</p>
                    <p className="font-medium">{status.jobOrder.item?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Quantity</p>
                    <p className="font-medium">{status.jobOrder.quantity}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xl font-bold">{status.counts.total}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{status.counts.pending}</p>
                  <p className="text-xs text-slate-400">Pending</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{status.counts.completed}</p>
                  <p className="text-xs text-slate-400">Completed</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{status.counts.balance}</p>
                  <p className="text-xs text-slate-400">Balance</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="font-medium mb-3">Scan Serial ID</h2>
              {scanError && (
                <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{scanError}</div>
              )}
              <form onSubmit={handleScanSubmit}>
                <div className="relative mb-1">
                  <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={serialId}
                    onChange={(e) => setSerialId(e.target.value)}
                    placeholder="Scan or type serial number"
                    className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm"
                    autoFocus
                  />
                </div>
                {status?.jobOrder?.item?.serialNoLength && (
                  <p
                    className={`text-xs mb-3 ${
                      serialId && serialId.trim().length !== status.jobOrder.item.serialNoLength
                        ? "text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    Expected length: {status.jobOrder.item.serialNoLength} characters
                    {serialId && ` (currently ${serialId.trim().length})`}
                  </p>
                )}
                {!status?.jobOrder?.item?.serialNoLength && <div className="mb-3" />}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={scanStatus === "Pass"}
                      onChange={() => setScanStatus("Pass")}
                    />
                    <span className="text-green-600 font-medium">Pass</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={scanStatus === "Fail"}
                      onChange={() => setScanStatus("Fail")}
                    />
                    <span className="text-red-600 font-medium">Fail</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Submit Scan
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b font-medium text-sm flex justify-between items-center">
                <span>Scan Log</span>
                <button
                  onClick={() => setShowAllLogs(true)}
                  className="text-purple-600 text-xs font-medium hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Serial ID</th>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400">No scans yet.</td></tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log._id} className="border-t">
                          <td className="px-4 py-2">{log.serialId}</td>
                          <td className="px-4 py-2 text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                log.status === "Pass"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => handleDeleteLog(log._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete scan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {showAllLogs && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">All Scans — {status?.jobOrder?.jobOrderNo}</h2>
              <button onClick={() => setShowAllLogs(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left sticky top-0">
                <tr>
                  <th className="px-4 py-2">Serial ID</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Scanned By</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {allLogsLoading ? (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">Loading...</td></tr>
                ) : allLogsData.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-400">No scans yet.</td></tr>
                ) : (
                  allLogsData.map((log) => (
                    <tr key={log._id} className="border-t">
                      <td className="px-4 py-2">{log.serialId}</td>
                      <td className="px-4 py-2 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            log.status === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{log.scannedBy?.name || "—"}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-slate-500">
                Page {allLogsPage} of {totalPages} ({allLogsTotal} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => loadAllLogs(allLogsPage - 1)}
                  disabled={allLogsPage <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => loadAllLogs(allLogsPage + 1)}
                  disabled={allLogsPage >= totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}