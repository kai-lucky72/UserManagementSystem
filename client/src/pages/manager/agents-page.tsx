import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { UserCog, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManagerAgentsPage() {
  const { user } = useAuth();
  const [salesStaffFilter, setSalesStaffFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["/api/manager/agents"],
  });

  // Fetch sales staff for filter
  const { data: salesStaff = [], isLoading: isLoadingSalesStaff } = useQuery({
    queryKey: ["/api/manager/sales-staff"],
  });

  // Apply filters
  const filteredAgents = agents.filter((agent: any) => {
    // Filter by sales staff
    if (salesStaffFilter !== "all" && agent.managerId !== parseInt(salesStaffFilter)) {
      return false;
    }
    
    // Filter by role
    if (roleFilter !== "all" && agent.role !== roleFilter) {
      return false;
    }
    
    return true;
  });

  // Get sales staff name by ID
  const getSalesStaffName = (id: number) => {
    const staff = salesStaff.find((s: any) => s.id === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : "Unknown";
  };

  if (!user || user.role !== "Manager") {
    return (
      <Layout title="Unauthorized">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-semibold mb-2">Unauthorized Access</h1>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Agents">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">All Agents</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Sales Staff</label>
          <Select 
            value={salesStaffFilter} 
            onValueChange={setSalesStaffFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sales Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sales Staff</SelectItem>
              {salesStaff.map((staff: any) => (
                <SelectItem key={staff.id} value={staff.id.toString()}>
                  {staff.firstName} {staff.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
          <Select 
            value={roleFilter} 
            onValueChange={setRoleFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Agent">Agent</SelectItem>
              <SelectItem value="TeamLeader">Team Leader</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Agents</CardTitle>
          <CardDescription>View all agents across your sales staff</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoadingAgents || isLoadingSalesStaff ? (
            <div className="p-8 text-center">Loading agents...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No agents found with the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent: any) => (
                    <tr key={agent.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full ${agent.role === 'TeamLeader' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'} flex items-center justify-center`}>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSalesStaffName(agent.managerId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={agent.isActive ? "success" : "secondary"}>
                          {agent.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span className="sr-only md:not-sr-only md:inline-block">Message</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </Layout>
  );
}
