import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import axiosInstance from "../../api/axiosInstance";

const navGroups = [
  {
    items: [
      { label: "Rework Dashboard", path: "/rework/dashboard" },
      { label: "TRC In & Out", path: "/rework/trc" },
    ],
  },
];

export default function TrcDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [trcDefect, setTrcDefect] = useState("");
  const [trcDefectLocation, setTrcDefectLocation] = useState("");
  const [repairRemarks, setRepairRemarks] = useState("");
  const [rootCause, setRootCause] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/trc/${id}`);
      setRecord(res.data.record);
      setTrcDefect(res.data.record.checkOut?.trcDefect || "");
      setTrcDefectLocation(res.data.record.checkOut?.trcDefectLocation || "");
      setRepairRemarks(res.data.record.checkOut?.repairRemarks || "");
      setRootCause(res.data.record.checkOut?.rootCause || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load TRC record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCheckIn = async () => {
    setActionError("");
    try {
      await axiosInstance.put(`/trc/${id}/check-in`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleSaveDetails = async () => {
    setActionError("");
    if (!trcDefect.trim() || !trcDefectLocation.trim()) {
      setActionError("Defect and Defect Location are required.");
      return false;
    }
    try {
      await axiosInstance.put(`/trc/${id}`, {
        trcDefect: trcDefect.trim(),
        trcDefectLocation: trcDefectLocation.trim(),
        repairRemarks,
        rootCause,
      });
      return true;
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to save rework details");
      return false;
    }
  };

  const handleOpenCheckOut = async () => {
    const saved = await handleSaveDetails();
    if (saved) setShowConfirm(true);
  };

  const handleConfirmCheckOut = async (result) => {
    setActionError("");
    try {
      await axiosInstance.put(`/trc/${id}/check-out`, {
        result,
        trcDefect: trcDefect.trim(),
        trcDefectLocation: trcDefectLocation.trim(),
        repairRemarks,
        rootCause,
      });
      setShowConfirm(false);
      navigate("/rework/trc");
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to check out");
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <Layout portalName="Rework Portal" theme="amber" navGroups={navGroups}>
        <p className="text-slate-400 text-sm">Loading...</p>
      </Layout>
    );
  }

  if (error || !record) {
    return (
      <Layout portalName="Rework Portal" theme="amber" navGroups={navGroups}>
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error || "Record not found"}</div>
      </Layout>
    );
  }

  return (
    <Layout portalName="Rework Portal" theme="amber" navGroups={navGroups}>
      <Link to="/rework/trc" className="text-sm text-amber-700 hover:underline">
        ← Back to TRC In & Out
      </Link>

      <div className="mt-4 mb-1 text-sm text-slate-500">
        Dashboard &gt; TRC In &amp; Out &gt; {record.serialId}
      </div>
      <h1 className="text-xl font-bold mb-5">
        {record.operation?.operationCode} - {record.operation?.operationName}
      </h1>

      {actionError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{actionError}</div>}

      <div className="bg-white rounded-xl border p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <p className="text-xs text-slate-400">Job Order</p>
            <p className="font-medium">{record.jobOrder?.jobOrderNo}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Item No.</p>
            <p className="font-medium">{record.item?.itemCode}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Item Desc</p>
            <p className="font-medium">{record.item?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date</p>
            <p className="font-medium">{new Date(record.failedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Check In</p>
            <p className="font-medium">{record.checkIn?.at ? new Date(record.checkIn.at).toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Check Out</p>
            <p className="font-medium">{record.checkOut?.at ? new Date(record.checkOut.at).toLocaleString() : "—"}</p>
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Scan Serial ID</label>
        <input
          value={record.serialId}
          readOnly
          className="w-full max-w-md border rounded-lg px-3 py-2 text-sm bg-slate-50 mb-4"
        />

        {record.status === "Pending" && (
          <button
            onClick={handleCheckIn}
            className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            TRC Check In
          </button>
        )}

        {record.status === "CheckedOut" && (
          <span
            className={`inline-block px-3 py-1 rounded text-sm font-medium ${
              record.checkOut?.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            Checked Out — {record.checkOut?.result}
          </span>
        )}
      </div>

      {(record.status === "CheckedIn" || record.status === "CheckedOut") && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-medium mb-4">Rework Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Defect (Line Operator)</p>
              <p className="text-sm font-medium bg-slate-50 border rounded-lg px-3 py-2">{record.defect}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Defect Location (Line Operator)</p>
              <p className="text-sm font-medium bg-slate-50 border rounded-lg px-3 py-2">{record.defectLocation}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Defect (TRC User) *</label>
              <input
                value={trcDefect}
                onChange={(e) => setTrcDefect(e.target.value)}
                disabled={record.status === "CheckedOut"}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Defect Location (TRC User) *</label>
              <input
                value={trcDefectLocation}
                onChange={(e) => setTrcDefectLocation(e.target.value)}
                disabled={record.status === "CheckedOut"}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">TRC Repair Eng. Remarks (optional)</label>
              <input
                value={repairRemarks}
                onChange={(e) => setRepairRemarks(e.target.value)}
                disabled={record.status === "CheckedOut"}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Root Cause Analysis (optional)</label>
              <input
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                disabled={record.status === "CheckedOut"}
                className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>
          </div>

          {record.status === "CheckedIn" && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveDetails}
                className="border px-4 py-2 rounded-lg text-sm font-medium text-slate-600"
              >
                Save
              </button>
              <button
                onClick={handleOpenCheckOut}
                className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                TRC Check Out
              </button>
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-bold mb-2">Confirm Check Out</h2>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to pass serial <strong>{record.serialId}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleConfirmCheckOut("Pass")}
                className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                Pass
              </button>
              <button
                onClick={() => handleConfirmCheckOut("Fail")}
                className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                Fail
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="border px-5 py-2 rounded-lg text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}