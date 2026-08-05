import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Search } from "lucide-react";

const navGroups = [
  {
    items: [
      { label: "Job Order", path: "/supervisor/job-order-list" },
      { label: "Traceability", path: "/supervisor/traceability" },
    ],
  },
];

export default function SupervisorDashboard() {
  const navigate = useNavigate();

  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-6">Supervisor Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <button
          onClick={() => navigate("/supervisor/job-order-list")}
          className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center gap-3 hover:border-green-400 hover:shadow-md transition text-center"
        >
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <span className="font-medium">Job Order</span>
          <span className="text-xs text-slate-400">Create and manage job orders</span>
        </button>

        <button
          onClick={() => navigate("/supervisor/traceability")}
          className="bg-white rounded-xl shadow-sm border p-6 flex flex-col items-center gap-3 hover:border-green-400 hover:shadow-md transition text-center"
        >
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <Search size={22} />
          </div>
          <span className="font-medium">Traceability</span>
          <span className="text-xs text-slate-400">View rejected / failed scans</span>
        </button>
      </div>
    </Layout>
  );
}