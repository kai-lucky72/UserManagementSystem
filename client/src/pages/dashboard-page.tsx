import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import StatsCard from "@/components/common/stats-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateUserDialog from "@/components/dialogs/create-user-dialog";
import CreateClientDialog from "@/components/dialogs/create-client-dialog";
import ActivityLog from "@/components/admin/activity-log";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Check, Users, CheckCircle, ClipboardList, UserPlus, MessageSquare, Calendar, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);

  if (!user) {
    return null;
  }

  const todayString = format(new Date(), 'yyyy-MM-dd');

  let endpoint = "";
  let userType: "manager" | "salesStaff" | "agent" = "manager";
  
  switch (user.role) {
    case "Admin":
      endpoint = "/api/admin/managers";
      userType = "manager";
      return <AdminDashboard />;
    case "Manager":
      endpoint = "/api/manager/sales-staff";
      userType = "salesStaff";
      return <ManagerDashboard />;
    case "SalesStaff":
      endpoint = "/api/sales-staff/agents";
      userType = "agent";
      return <SalesStaffDashboard />;
    case "TeamLeader":
    case "Agent":
      return <AgentDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}

function AdminDashboard() {
  const [isCreateManagerDialogOpen, setIsCreateManagerDialogOpen] = useState(false);
  
  // Fetch managers
  const { data: managers = [] } = useQuery({
    queryKey: ["/api/admin/managers"],
  });
  
  // Fetch help requests
  const { data: helpRequests = [] } = useQuery({
    queryKey: ["/api/admin/help-requests"],
  });
  
  // Count active and inactive managers
  const activeManagers = managers.filter((manager: any) => manager.isActive).length;
  const inactiveManagers = managers.length - activeManagers;
  
  // Count pending help requests
  const pendingHelpRequests = helpRequests.filter((request: any) => !request.resolved).length;
  
  return (
    <Layout title="Administrator Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administrator Dashboard</h1>
        <Button 
          onClick={() => setIsCreateManagerDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Create Manager
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          title="Total Users"
          value={managers.length}
          details={
            <div className="flex justify-between text-sm">
              <span>Active: {activeManagers}</span>
              <span>Inactive: {inactiveManagers}</span>
            </div>
          }
        />
        
        <StatsCard
          icon={<Check className="h-5 w-5" />}
          title="Active Managers"
          value={activeManagers}
          details={
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${managers.length > 0 ? (activeManagers / managers.length) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {managers.length > 0 ? Math.round((activeManagers / managers.length) * 100) : 0}% of managers active
              </p>
            </div>
          }
          colorClass="bg-green-100 text-green-600"
        />
        
        <StatsCard
          icon={<HelpCircle className="h-5 w-5" />}
          title="Help Requests"
          value={pendingHelpRequests}
          details={
            <div className="mt-2">
              <Button variant="link" className="text-sm p-0 h-auto">View all requests</Button>
            </div>
          }
          colorClass="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Managers Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Managers</CardTitle>
          <CardDescription>Manage your organization leaders</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {managers.map((manager: any) => (
                <tr key={manager.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <span className="font-medium">{manager.firstName[0]}{manager.lastName[0]}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{manager.firstName} {manager.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{manager.workId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{manager.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={manager.isActive ? "success" : "secondary"}>
                      {manager.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button variant="link" className="text-primary p-0 h-auto">
                        Edit
                      </Button>
                      <Button 
                        variant="link" 
                        className={manager.isActive ? "text-destructive" : "text-green-600"} 
                        size="sm"
                        onClick={async () => {
                          try {
                            const endpoint = manager.isActive 
                              ? `/api/admin/users/${manager.id}/deactivate`
                              : `/api/admin/users/${manager.id}/activate`;
                            
                            await fetch(endpoint, { method: 'POST' });
                            
                            // Log this activity
                            await fetch('/api/admin/activities', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                action: manager.isActive ? 'deactivate_user' : 'activate_user',
                                details: `Admin ${manager.isActive ? 'deactivated' : 'activated'} manager: ${manager.firstName} ${manager.lastName}`
                              })
                            });
                            
                            // Refresh data
                            queryClient.invalidateQueries({ queryKey: ["/api/admin/managers"] });
                          } catch (error) {
                            console.error("Error toggling manager status:", error);
                          }
                        }}
                      >
                        {manager.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {managers.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No managers found. Create your first manager to get started.
          </div>
        )}
      </Card>
      
      {/* Help Requests */}
      {/* Activity Log */}
      <div className="mb-6">
        <ActivityLog />
      </div>

      {/* Help Requests */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Recent Help Requests</CardTitle>
          <CardDescription>User assistance needed</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-gray-200">
          {helpRequests.length === 0 ? (
            <div className="py-6 text-center text-gray-500">
              No help requests found.
            </div>
          ) : (
            helpRequests.slice(0, 3).map((request: any) => (
              <div key={request.id} className="p-6">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">From: {request.email}</h4>
                    <p className="text-sm text-gray-700 mt-2">{request.message}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant={request.resolved ? "outline" : "secondary"}>
                      {request.resolved ? "Resolved" : "Pending"}
                    </Badge>
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleString()}
                    </span>
                    {!request.resolved && (
                      <Button 
                        size="sm" 
                        className="mt-4"
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create Manager Dialog */}
      <CreateUserDialog 
        isOpen={isCreateManagerDialogOpen}
        onClose={() => setIsCreateManagerDialogOpen(false)}
        userType="manager"
        endpoint="/api/admin/managers"
      />
    </Layout>
  );
}

function ManagerDashboard() {
  const [isCreateSalesStaffDialogOpen, setIsCreateSalesStaffDialogOpen] = useState(false);
  
  // Fetch sales staff
  const { data: salesStaff = [] } = useQuery({
    queryKey: ["/api/manager/sales-staff"],
  });
  
  // Fetch agents (across all sales staff)
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/manager/agents"],
  });

  // Calculate stats
  const activeSalesStaff = salesStaff.filter((staff: any) => staff.isActive).length;
  const individualAgents = agents.filter((agent: any) => agent.role === "Agent").length;
  const teamLeaders = agents.filter((agent: any) => agent.role === "TeamLeader").length;
  
  // Example data for attendance (would come from API in real implementation)
  const totalAgents = agents.length;
  const presentAgents = Math.round(totalAgents * 0.85); // Simulating 85% attendance

  return (
    <Layout title="Manager Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manager Dashboard</h1>
        <Button 
          onClick={() => setIsCreateSalesStaffDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Create Sales Staff
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          title="Sales Staff"
          value={salesStaff.length}
          details={
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{activeSalesStaff} Active</span>
              <span className="text-gray-500">{salesStaff.length - activeSalesStaff} Inactive</span>
            </div>
          }
        />
        
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          title="Total Agents"
          value={agents.length}
          details={
            <div className="flex justify-between text-sm">
              <span>Individual: {individualAgents}</span>
              <span>Team Leaders: {teamLeaders}</span>
            </div>
          }
          colorClass="bg-indigo-100 text-indigo-600"
        />
        
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          title="Attendance Today"
          value={presentAgents}
          details={
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${totalAgents > 0 ? (presentAgents / totalAgents) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalAgents > 0 ? Math.round((presentAgents / totalAgents) * 100) : 0}% of agents present
              </p>
            </div>
          }
          colorClass="bg-green-100 text-green-600"
        />
      </div>

      {/* Sales Staff Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Sales Staff</CardTitle>
          <CardDescription>Manage your sales staff members</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agents</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesStaff.map((staff: any) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <span className="font-medium">{staff.firstName[0]}{staff.lastName[0]}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{staff.firstName} {staff.lastName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.workId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={staff.isActive ? "success" : "secondary"}>
                      {staff.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agents.filter((agent: any) => agent.managerId === staff.id).length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button variant="link" className="text-primary p-0 h-auto">Edit</Button>
                      <Button variant="link" className="text-indigo-600 p-0 h-auto">Message</Button>
                      <Button 
                        variant="link" 
                        className={staff.isActive ? "text-destructive" : "text-green-600"} 
                        size="sm"
                      >
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {salesStaff.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No sales staff found. Create your first sales staff to get started.
          </div>
        )}
      </Card>
      
      {/* Messages */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Communication with your team</CardDescription>
        </CardHeader>
        <div className="divide-y divide-gray-200">
          <div className="p-6 text-center text-gray-500">
            No messages to display. Your conversations will appear here.
          </div>
        </div>
      </Card>

      {/* Create Sales Staff Dialog */}
      <CreateUserDialog 
        isOpen={isCreateSalesStaffDialogOpen}
        onClose={() => setIsCreateSalesStaffDialogOpen(false)}
        userType="salesStaff"
        endpoint="/api/manager/sales-staff"
      />
    </Layout>
  );
}

function SalesStaffDashboard() {
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  
  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/sales-staff/agents"],
  });
  
  // Fetch agent groups
  const { data: agentGroups = [] } = useQuery({
    queryKey: ["/api/sales-staff/agent-groups"],
  });

  // Calculate stats
  const individualAgents = agents.filter((agent: any) => agent.role === "Agent").length;
  const teamLeaders = agents.filter((agent: any) => agent.role === "TeamLeader").length;
  
  // Example data for attendance (would come from API in real implementation)
  const totalAgents = agents.length;
  const presentAgents = Math.round(totalAgents * 0.85); // Simulating 85% attendance

  return (
    <Layout title="Sales Staff Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Staff Dashboard</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setIsCreateGroupDialogOpen(true)}
            className="inline-flex items-center"
            variant="outline"
          >
            <Users className="mr-2 h-4 w-4" /> Create Agent Group
          </Button>
          <Button 
            onClick={() => setIsCreateAgentDialogOpen(true)}
            className="inline-flex items-center"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          title="Total Agents"
          value={agents.length}
          details={
            <div className="flex justify-between text-sm">
              <span>Individual: {individualAgents}</span>
              <span>Team Leaders: {teamLeaders}</span>
            </div>
          }
        />
        
        <StatsCard
          icon={<CheckCircle className="h-5 w-5" />}
          title="Attendance Today"
          value={presentAgents}
          details={
            <div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${totalAgents > 0 ? (presentAgents / totalAgents) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalAgents > 0 ? Math.round((presentAgents / totalAgents) * 100) : 0}% of agents present
              </p>
            </div>
          }
          colorClass="bg-green-100 text-green-600"
        />
        
        <StatsCard
          icon={<UserPlus className="h-5 w-5" />}
          title="New Clients"
          value="24"
          details={
            <div className="mt-2">
              <span className="text-xs text-green-600 font-medium">↑ 12% from last week</span>
            </div>
          }
          colorClass="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* Agent Groups */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Agent Groups</CardTitle>
          <CardDescription>Team performance overview</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {agentGroups.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No agent groups found. Create your first group to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agentGroups.map((group: any) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Team Leader: {group.leaderId ? `Leader #${group.leaderId}` : "Not assigned"}
                      </p>
                    </div>
                    <Badge variant={group.isActive ? "success" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="default">View Details</Button>
                    <Button size="sm" variant="outline">Message</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Agents */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Individual Agents</CardTitle>
          <CardDescription>Direct reports</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent: any) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <span className="font-medium">{agent.firstName[0]}{agent.lastName[0]}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.firstName} {agent.lastName}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.workId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={agent.isActive ? "success" : "secondary"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button variant="link" className="text-primary p-0 h-auto">Edit</Button>
                      <Button variant="link" className="text-indigo-600 p-0 h-auto">Message</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agents.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No agents found. Add your first agent to get started.
          </div>
        )}
      </Card>

      {/* Create Agent Dialog */}
      <CreateUserDialog 
        isOpen={isCreateAgentDialogOpen}
        onClose={() => setIsCreateAgentDialogOpen(false)}
        userType="agent"
        endpoint="/api/sales-staff/agents"
      />
    </Layout>
  );
}

function AgentDashboard() {
  const { user } = useAuth();
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  
  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/agent/clients"],
  });
  
  // Check if agent has submitted attendance for today
  const { data: attendance } = useQuery({
    queryKey: ["/api/agent/attendance"],
  });

  const hasCheckedIn = !!attendance;
  
  // Handle check-in
  const handleCheckIn = () => {
    // Implementation would use a mutation to post attendance data
    console.log("Checking in...");
  };

  return (
    <Layout title="Agent Dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agent Dashboard</h1>
        <Button 
          onClick={() => setIsCreateClientDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      {/* Daily Status */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Today's Status</h2>
            <div>
              <span className="text-sm text-gray-500">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`border rounded-lg p-4 ${hasCheckedIn ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${hasCheckedIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Attendance</h3>
                  {hasCheckedIn ? (
                    <>
                      <p className="text-lg font-semibold text-green-600">Checked In</p>
                      <p className="text-xs text-gray-500">{format(new Date(attendance.checkInTime), 'hh:mm a')} - {attendance.location || 'No location'}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-gray-900">Not Checked In</p>
                      <Button size="sm" variant="outline" className="mt-1" onClick={handleCheckIn}>
                        Check In Now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Clients</h3>
                  <p className="text-lg font-semibold text-gray-900">{clients.length} Total</p>
                  <p className="text-xs text-gray-500">
                    {clients.filter((client: any) => {
                      const clientDate = new Date(client.createdAt);
                      const today = new Date();
                      return (
                        clientDate.getDate() === today.getDate() &&
                        clientDate.getMonth() === today.getMonth() &&
                        clientDate.getFullYear() === today.getFullYear()
                      );
                    }).length} Today
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Daily Report</h3>
                  <p className="text-lg font-semibold text-gray-900">Not Submitted</p>
                  <Button size="sm" variant="link" className="p-0 h-auto mt-1">Submit Report</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Clients */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Recent Clients</CardTitle>
          <CardDescription>Your latest client registrations</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client: any) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.firstName} {client.lastName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.insuranceProduct || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.feePaid ? `$${client.feePaid.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="link" className="text-primary p-0 h-auto">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No clients found. Add your first client to get started.
          </div>
        )}
      </Card>
      
      {/* Messages & Notifications */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Messages from Sales Staff</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-200">
          <div className="p-6 text-center text-gray-500">
            No messages to display. Your conversations will appear here.
          </div>
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <CreateClientDialog 
        isOpen={isCreateClientDialogOpen}
        onClose={() => setIsCreateClientDialogOpen(false)}
      />
    </Layout>
  );
}
