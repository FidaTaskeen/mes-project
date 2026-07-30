import Layout from "../../components/Layout";

const navGroups = [
  {
    items: [
      { label: "Supervisor Dashboard", path: "/supervisor/dashboard" },
      { label: "Job Orders", path: "/supervisor/job-orders" },
      { label: "Create Job Order", path: "/supervisor/create-job-order" },
      { label: "Job Order List", path: "/supervisor/job-order-list" },
      { label: "Production Monitoring", path: "/supervisor/monitoring" },
      { label: "Reports", path: "/supervisor/reports" },
    ],
  },
];

export default function SupervisorDashboard() {
  return (
    <Layout portalName="Supervisor Portal" theme="green" navGroups={navGroups}>
      <h1 className="text-2xl font-bold mb-4">Supervisor Dashboard</h1>
      <p className="text-slate-500">
        Job order counts and today's production summary will go here.
      </p>
    </Layout>
  );
}