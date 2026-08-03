import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { QrCode, RefreshCcw } from "lucide-react";
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
    ],
  },
];

export default function ScanJobOrder() {
  const location = useLocation();
  const navigate = useNavigate();

  const [jobOrderNoInput, setJobOrderNoInput] = useState(location.state?.jobOrderNo || "");
  const [jobOrder, setJobOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [serialId, setSerialId] = useState("");
  const [status, setStatus] = useState("Pass");
  const [submitting, setSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  const loadJobOrder = async (jobOrderNo) => {
    if (!jobOrderNo) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/joborders/scan/${jobOrderNo}`);
      setJobOrder(res.data.jobOrder);
      setCurrentStep(res.data.currentStep);
      loadRecentScans(res.data.jobOrder.jobOrderNo);
    } catch (err) {
      setJobOrder(null);
      setError(err.response?.data?.message || "Failed to load job order");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentScans = async (jobOrderNo) => {
    try {
      const res = await axiosInstance.get("/scan-logs", {
        params: { jobOrderNo, page: 1, limit: 5 },
      });
      setRecentScans(res.data.logs || []);
    } catch {
      // non-fatal, leave the panel empty
    }
  };

  useEffect(() => {
    if (location.state?.jobOrderNo) {
      loadJobOrder(location.state.jobOrderNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitScan = async (e) => {
    e.preventDefault();
    if (!serialId.trim() || !jobOrder) return;
    setSubmitting(true);
    setError("");
    try {
      await axiosInstance.post("/scan-logs", {
        jobOrderNo: jobOrder.jobOrderNo,
        serialId: serialId.trim(),
        status,
      });
      setSerialId("");
      setStatus("Pass");
      await loadJobOrder(jobOrder.jobOrderNo); // refresh counters + step
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record scan");
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = jobOrder?.quantity || 0;
  const completedQty = jobOrder?.completedQuantity || 0;
  const rejectQty = jobOrder?.rejectQuantity || 0;
  const processed = completedQty + rejectQty;
  const pending = Math.max(totalQty - processed, 0);
  const balance = pending;

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Scan Job Order</h1>

      {!jobOrder && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadJobOrder(jobOrderNoInput.trim());
          }}
          className="bg-white rounded-lg shadow p-6 max-w-md mb-6"
        >
          <label className="text-sm text-slate-500 mb-1 block">Job Order No.</label>
          <div className="flex gap-2">
            <input
              value={jobOrderNoInput}
              onChange={(e) => setJobOrderNoInput(e.target.value)}
              placeholder="e.g. JO-2026-0001"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
        </form>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 max-w-2xl">{error}</div>}

      {jobOrder && currentStep && (
        <>
          {/* Summary card */}
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400">{currentStep.operation.operationName}</p>
                <h2 className="text-lg font-semibold">{jobOrder.jobOrderNo}</h2>
              </div>
              <button
                onClick={() => { setJobOrder(null); setJobOrderNoInput(""); }}
                className="text-xs text-purple-600 hover:underline flex items-center gap-1"
              >
                <RefreshCcw size={12} /> Scan another
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
              <div><p className="text-slate-400 text-xs">Item</p><p className="font-medium">{jobOrder.item?.itemCode}</p></div>
              <div><p className="text-slate-400 text-xs">Description</p><p className="font-medium">{jobOrder.item?.name}</p></div>
              <div><p className="text-slate-400 text-xs">Quantity</p><p className="font-medium">{totalQty}</p></div>
              <div><p className="text-slate-400 text-xs">Work Center</p><p className="font-medium">{currentStep.operation.workCenter || "-"}</p></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{totalQty}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{pending}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-green-600">{completedQty}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{balance}</p>
                <p className="text-xs text-slate-500">Balance</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Scan input */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-medium mb-3">Scan Serial ID</h3>
              <form onSubmit={handleSubmitScan}>
                <div className="flex items-center border rounded-lg px-3 py-2 mb-3">
                  <input
                    value={serialId}
                    onChange={(e) => setSerialId(e.target.value)}
                    placeholder="Scan or type serial ID"
                    className="flex-1 outline-none text-sm"
                    autoFocus
                  />
                  <QrCode size={18} className="text-slate-400" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={status === "Pass"} onChange={() => setStatus("Pass")} />
                    Pass
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={status === "Fail"} onChange={() => setStatus("Fail")} />
                    Fail
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !serialId.trim()}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Scan"}
                </button>
              </form>
            </div>

            {/* Scan log */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Scan Log</h3>
                <Link
                  to={`/operator/scan/${jobOrder.jobOrderNo}/logs`}
                  className="text-xs text-purple-600 hover:underline"
                >
                  View All
                </Link>
              </div>
              {recentScans.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No scans yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs">
                      <th className="pb-2">Serial ID</th>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.map((log) => (
                      <tr key={log._id} className="border-t">
                        <td className="py-2">{log.serialId}</td>
                        <td className="py-2 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={log.status === "Pass" ? "text-green-600" : "text-red-600"}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}