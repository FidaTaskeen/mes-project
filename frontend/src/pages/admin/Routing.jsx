import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import Layout from "../../components/Layout";

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

const routingOperations = [
  { sequence: 10, operationCode: "OP10", operationName: "Loading", stage: "Start", previousOperation: "-", type: "Automatic", scan: "Serial No" },
  { sequence: 20, operationCode: "OP20", operationName: "SPI", stage: "Middle", previousOperation: "Loading", type: "Inspection", scan: "Serial No" },
  { sequence: 30, operationCode: "OP30", operationName: "AOI", stage: "Middle", previousOperation: "SPI", type: "Inspection", scan: "Serial No" },
  { sequence: 40, operationCode: "OP40", operationName: "Unloading", stage: "Middle", previousOperation: "AOI", type: "Automatic", scan: "Serial No" },
  { sequence: 50, operationCode: "OP50", operationName: "Manual Insertion", stage: "Middle", previousOperation: "Unloading", type: "Manual", scan: "Serial No" },
  { sequence: 60, operationCode: "OP60", operationName: "Post Wave Inspection", stage: "Middle", previousOperation: "Manual Insertion", type: "Inspection", scan: "Serial No" },
  { sequence: 70, operationCode: "OP70", operationName: "Depanelling", stage: "Middle", previousOperation: "Post Wave Inspection", type: "Manual", scan: "Serial No" },
  { sequence: 80, operationCode: "OP80", operationName: "Visual Inspection", stage: "Middle", previousOperation: "Depanelling", type: "Inspection", scan: "Serial No" },
  { sequence: 90, operationCode: "OP90", operationName: "Functional Testing", stage: "Middle", previousOperation: "Visual Inspection", type: "Testing", scan: "Serial No" },
  { sequence: 100, operationCode: "OP100", operationName: "OQC", stage: "Middle", previousOperation: "Functional Testing", type: "Inspection", scan: "Serial No" },
  { sequence: 110, operationCode: "OP110", operationName: "Packing", stage: "End", previousOperation: "OQC", type: "Manual", scan: "Serial No" },
];

export default function Routing() {
  const [routings] = useState([
    {
      routingNo: "R00001",
      itemNo: "PR001",
      description: "TVSE Thermal Printer",
      bomNo: "BOM001",
      version: "Version 1",
      status: "Active",
    },
  ]);

  return (
    <Layout portalName="Admin Portal" theme="blue" navGroups={navGroups}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Routing Master</h1>
          <p className="text-slate-500 text-sm">Item → BOM → Routing</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          + Create Routing
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Routing No</th>
              <th className="px-4 py-3 text-left">Item No</th>
              <th className="px-4 py-3 text-left">Item No - Description</th>
              <th className="px-4 py-3 text-left">BOM No</th>
              <th className="px-4 py-3 text-left">Version</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routings.map((routing, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-3">{routing.routingNo}</td>
                <td className="px-4 py-3">{routing.itemNo}</td>
                <td className="px-4 py-3">{routing.description}</td>
                <td className="px-4 py-3">{routing.bomNo}</td>
                <td className="px-4 py-3">{routing.version}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs">
                    {routing.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-600">
                    <Pencil size={16} />
                  </button>
                  <button className="text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow border mt-6 overflow-x-auto">
        <div className="px-4 py-3 border-b bg-slate-100 font-semibold">
          Routing Operations
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Sequence</th>
              <th className="px-3 py-2 text-left">Operation Code</th>
              <th className="px-3 py-2 text-left">Operation Name</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">Previous Operation</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Scan</th>
            </tr>
          </thead>
          <tbody>
            {routingOperations.map((op, index) => (
              <tr key={index} className="border-t">
                <td className="px-3 py-2">{op.sequence}</td>
                <td className="px-3 py-2">{op.operationCode}</td>
                <td className="px-3 py-2">{op.operationName}</td>
                <td className="px-3 py-2">{op.stage}</td>
                <td className="px-3 py-2">{op.previousOperation}</td>
                <td className="px-3 py-2">{op.type}</td>
                <td className="px-3 py-2">{op.scan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}