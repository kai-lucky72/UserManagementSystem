import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreateUserDialog from "@/components/dialogs/create-user-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, MoreHorizontal, Edit, Trash, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SalesStaffAgentsPage() {
  const { user } = useAuth();
  const [isCreateAgentDialogOpen, setIsCreateAgentDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ["/api/sales-staff/agents"],
  });

  // Delete (deactivate) agent mutation
  const deactivateAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/sales-staff/agents/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agents"] });
      toast({
        title: "Agent deactivated",
        description: "The agent has been deactivated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeactivate = (id: number) => {
    deactivateAgentMutation.mutate(id);
  };

  // Apply filters
  const filteredAgents = agents.filter((agent: any) => {
    // Filter by role
    if (roleFilter !== "all" && agent.role !== roleFilter) {
      return false;
    }
    return true;
  });

  if (!user || user.role !== "SalesStaff") {
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
        <h1 className="text-2xl font-semibold text-gray-900">My Agents</h1>
        <Button 
          onClick={() => setIsCreateAgentDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
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
          <CardTitle>All Agents</CardTitle>
          <CardDescription>Manage your agents and team leaders</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">Loading agents...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Error loading agents: {(error as Error).message}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No agents found. Add your first agent to get started.
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={agent.isActive ? "success" : "secondary"}>
                          {agent.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Message
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deactivate Agent</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate this agent? 
                                    They will no longer be able to access the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeactivate(agent.id)}
                                  >
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
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
