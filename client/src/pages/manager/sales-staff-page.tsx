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

export default function SalesStaffPage() {
  const { user } = useAuth();
  const [isCreateSalesStaffDialogOpen, setIsCreateSalesStaffDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sales staff
  const { data: salesStaff = [], isLoading, error } = useQuery({
    queryKey: ["/api/manager/sales-staff"],
  });

  // Fetch agents to count per sales staff
  const { data: allAgents = [] } = useQuery({
    queryKey: ["/api/manager/agents"],
  });

  // Delete (deactivate) sales staff mutation
  const deactivateSalesStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/manager/sales-staff/${id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manager/sales-staff"] });
      toast({
        title: "Sales staff deactivated",
        description: "The sales staff member has been deactivated.",
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
    deactivateSalesStaffMutation.mutate(id);
  };

  // Count agents for each sales staff
  const getAgentCount = (salesStaffId: number) => {
    return allAgents.filter((agent: any) => agent.managerId === salesStaffId).length;
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
    <Layout title="Sales Staff">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Staff</h1>
        <Button 
          onClick={() => setIsCreateSalesStaffDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Create Sales Staff
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>All Sales Staff</CardTitle>
          <CardDescription>Manage your sales staff members</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">Loading sales staff...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Error loading sales staff: {(error as Error).message}</div>
          ) : (
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
                {salesStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No sales staff found. Create your first sales staff to get started.
                    </td>
                  </tr>
                ) : (
                  salesStaff.map((staff: any) => (
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
                        {getAgentCount(staff.id)}
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
                                  <AlertDialogTitle>Deactivate Sales Staff</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to deactivate this sales staff member? 
                                    They will no longer be able to access the system, but their 
                                    agents' data will remain in the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeactivate(staff.id)}
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
