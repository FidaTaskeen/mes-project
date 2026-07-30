import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminItems from "./pages/admin/Items";
import SupervisorDashboard from "./pages/supervisor/Dashboard";
import OperatorDashboard from "./pages/operator/Dashboard";
import AdminOperations from "./pages/admin/Operations";
import AdminUsers from "./pages/admin/Users";
import CreateJobOrder from "./pages/supervisor/CreateJobOrder";
import JobOrderList from "./pages/supervisor/JobOrderList";
import JobOrderDetails from "./pages/supervisor/JobOrderDetails";
import ProductionMonitoring from "./pages/supervisor/ProductionMonitoring";
import RolesPermissions from "./pages/admin/RolesPermissions";
import Settings from "./pages/admin/Settings";
import AuditLogs from "./pages/admin/AuditLogs";
import BackupRestore from "./pages/admin/BackupRestore";
import Reports from "./pages/supervisor/Reports";
import ScanJobOrder from "./pages/operator/ScanJobOrder";
import MyOperations from "./pages/operator/MyOperations";
import ProductionEntry from "./pages/operator/ProductionEntry";
import ProductionHistory from "./pages/operator/ProductionHistory";
import MyPerformance from "./pages/operator/MyPerformance";
import BOM from "./pages/admin/BOM";
import Routing from "./pages/admin/Routing";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminItems />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/operations"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminOperations />
              </ProtectedRoute>
  }
/>
          <Route
           path="/admin/users"
           element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminUsers />
            </ProtectedRoute>
  }
/>
          <Route
           path="/admin/roles"
            element={
             <ProtectedRoute allowedRoles={["Admin"]}>
              <RolesPermissions />
               </ProtectedRoute>} />

          <Route 
            path="/admin/settings"
             element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Settings />
                </ProtectedRoute>} />

          <Route
            path="/admin/audit-logs" 
             element={<ProtectedRoute allowedRoles={["Admin"]}>
              <AuditLogs />
               </ProtectedRoute>} />

          <Route 
            path="/admin/backup"
              element={<ProtectedRoute allowedRoles={["Admin"]}>
                <BackupRestore />
                 </ProtectedRoute>} />

          <Route
           path="/admin/bom"
            element={<ProtectedRoute allowedRoles={["Admin"]}>
              <BOM />
              </ProtectedRoute>} />

              <Route
               path="/admin/routing" 
               element={<ProtectedRoute allowedRoles={["Admin"]}>
                <Routing />
                </ProtectedRoute>} />

          {/* Supervisor routes */}
          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Supervisor"]}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/supervisor/create-job-order"
            element={
              <ProtectedRoute allowedRoles={["Supervisor"]}>
                <CreateJobOrder />
              </ProtectedRoute>
  }
/>
          <Route
            path="/supervisor/job-order-list"
            element={
             <ProtectedRoute allowedRoles={["Supervisor"]}>
               <JobOrderList />
             </ProtectedRoute>
  }
/>
          <Route
            path="/supervisor/job-order-details/:jobOrderNo"
            element={
             <ProtectedRoute allowedRoles={["Supervisor"]}>
               <JobOrderDetails />
             </ProtectedRoute>
  }
/>
          <Route
            path="/supervisor/monitoring"
            element={
              <ProtectedRoute allowedRoles={["Supervisor"]}>
                 <ProductionMonitoring />
              </ProtectedRoute>
  }
/>
          <Route 
          path="/supervisor/reports" 
          element={
            <ProtectedRoute allowedRoles={["Supervisor"]}>
              <Reports />
            </ProtectedRoute>} />

          {/* Operator routes */}
          <Route
            path="/operator/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Operator"]}>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
           path="/operator/scan" 
           element={<ProtectedRoute allowedRoles={["Operator"]}>
            <ScanJobOrder />
            </ProtectedRoute>} />

          <Route
           path="/operator/my-operations"
            element={<ProtectedRoute allowedRoles={["Operator"]}>
              <MyOperations />
              </ProtectedRoute>} />

          <Route 
          path="/operator/production-entry"
           element={<ProtectedRoute allowedRoles={["Operator"]}>
            <ProductionEntry />
             </ProtectedRoute>} />

          <Route 
          path="/operator/history"
           element={<ProtectedRoute allowedRoles={["Operator"]}>
            <ProductionHistory />
             </ProtectedRoute>} />

          <Route 
          path="/operator/performance" 
          element={<ProtectedRoute allowedRoles={["Operator"]}>
            <MyPerformance />
            </ProtectedRoute>} />

          <Route 
          path="/unauthorized"
           element={<h1 className="p-8">Not authorized</h1>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}