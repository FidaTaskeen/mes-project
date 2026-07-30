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

export default function OperatorDashboard() {
  return (
    <Layout portalName="Operator Portal" theme="purple" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-4">Operator Dashboard</h1>
      <p className="text-slate-500">
        Today's target, completed qty, and reject qty will go here.
      </p>
    </Layout>
  );
}