import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import { ProtectedRoute } from "./lib/protected-route";

// Admin pages
import ManagersPage from "@/pages/admin/managers-page";
import HelpRequestsPage from "@/pages/admin/help-requests-page";

// Manager pages
import SalesStaffPage from "@/pages/manager/sales-staff-page";
import ManagerAgentsPage from "@/pages/manager/agents-page";
import ManagerMessagesPage from "@/pages/manager/messages-page";

// Sales Staff pages
import SalesStaffAgentsPage from "@/pages/sales-staff/agents-page";
import AgentGroupsPage from "@/pages/sales-staff/agent-groups-page";
import SalesStaffMessagesPage from "@/pages/sales-staff/messages-page";

// Agent pages
import ClientsPage from "@/pages/agent/clients-page";
import AttendancePage from "@/pages/agent/attendance-page";
import AgentMessagesPage from "@/pages/agent/messages-page";

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Dashboard route */}
      <ProtectedRoute path="/" component={DashboardPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin/managers" component={ManagersPage} />
      <ProtectedRoute path="/admin/help-requests" component={HelpRequestsPage} />
      
      {/* Manager routes */}
      <ProtectedRoute path="/manager/sales-staff" component={SalesStaffPage} />
      <ProtectedRoute path="/manager/agents" component={ManagerAgentsPage} />
      <ProtectedRoute path="/manager/messages" component={ManagerMessagesPage} />
      
      {/* Sales Staff routes */}
      <ProtectedRoute path="/sales-staff/agents" component={SalesStaffAgentsPage} />
      <ProtectedRoute path="/sales-staff/agent-groups" component={AgentGroupsPage} />
      <ProtectedRoute path="/sales-staff/messages" component={SalesStaffMessagesPage} />
      
      {/* Agent routes */}
      <ProtectedRoute path="/agent/clients" component={ClientsPage} />
      <ProtectedRoute path="/agent/attendance" component={AttendancePage} />
      <ProtectedRoute path="/agent/messages" component={AgentMessagesPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
