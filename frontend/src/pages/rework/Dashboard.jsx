import { Link } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import Layout from "../../components/Layout";

const navGroups = [
  {
    items: [
      { label: "Rework Dashboard", path: "/rework/dashboard" },
      { label: "TRC In & Out", path: "/rework/trc" },
    ],
  },
];

export default function ReworkDashboard() {
  return (
    <Layout portalName="Rework Portal" theme="amber" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-slate-500 text-sm mb-6">Manage failed serials awaiting rework.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
        <Link
          to="/rework/trc"
          className="bg-white border rounded-xl p-5 flex flex-col items-center gap-2 text-center hover:border-amber-400 hover:shadow-sm transition"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <span className="text-sm font-medium text-slate-700">TRC In & Out</span>
        </Link>
      </div>
    </Layout>
  );
}