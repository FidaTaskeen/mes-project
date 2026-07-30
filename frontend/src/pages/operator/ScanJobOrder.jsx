import { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import Layout from "../../components/Layout";

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

const mockScannedOrder = {
  jobOrderNo: "JO-000124",
  item: "Bracket Assembly",
  itemCode: "ITM-002",
  quantity: 200,
  routing: "Routing A - Standard",
  currentOperation: "Welding",
};

export default function ScanJobOrder() {
  const [scannedOrder, setScannedOrder] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // decodedText is whatever string was encoded in the QR code —
        // e.g. the Job Order No. Later: GET /api/job-orders/{decodedText}
        console.log("Scanned:", decodedText);
        setScannedOrder(mockScannedOrder); // swap for real API fetch later
        scanner.clear();
        setScanning(false);
      },
      (error) => {
        // fires continuously while no QR is detected — ignore
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Scan Job Order</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        {!scanning && (
          <button
            onClick={() => { setScannedOrder(null); setScanning(true); }}
            className="w-full bg-purple-600 text-white py-2 rounded font-medium hover:bg-purple-700"
          >
            Start Camera Scan
          </button>
        )}
        {scanning && <div id="qr-reader" className="w-full" />}
      </div>

      {scannedOrder && (
        <div className="bg-white rounded-lg shadow p-6 max-w-md mt-6">
          <h2 className="font-medium mb-3">Job Order Loaded</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Job Order No.</span><span className="font-medium">{scannedOrder.jobOrderNo}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Item</span><span className="font-medium">{scannedOrder.item} ({scannedOrder.itemCode})</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Quantity</span><span className="font-medium">{scannedOrder.quantity}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Routing</span><span className="font-medium">{scannedOrder.routing}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Current Operation</span><span className="font-medium">{scannedOrder.currentOperation}</span></div>
          </div>
        </div>
      )}
    </Layout>
  );
}