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
import { UserPlus, MoreHorizontal, Edit, Trash, CheckCircle, XCircle } from "lucide-react";
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

export default function ManagersPage() {
  const { user } = useAuth();
  const [isCreateManagerDialogOpen, setIsCreateManagerDialogOpen] = useState(false);
  const [managerToUpdate, setManagerToUpdate] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch managers
  const { data: managers = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/managers"],
  });

  // Activate/deactivate manager mutation
  const toggleActivationMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: number; activate: boolean }) => {
      const endpoint = activate
        ? `/api/admin/users/${id}/activate`
        : `/api/admin/users/${id}/deactivate`;
      const res = await apiRequest("POST", endpoint);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/managers"] });
      toast({
        title: "Success",
        description: "Manager status updated successfully",
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

  const handleToggleActivation = (id: number, isActive: boolean) => {
    toggleActivationMutation.mutate({ id, activate: !isActive });
  };

  if (!user || user.role !== "Admin") {
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
    <Layout title="Managers">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Managers</h1>
        <Button 
          onClick={() => setIsCreateManagerDialogOpen(true)}
          className="inline-flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Create Manager
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>All Managers</CardTitle>
          <CardDescription>View and manage organization leaders</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">Loading managers...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Error loading managers: {(error as Error).message}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Staff</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No managers found. Create your first manager to get started.
                    </td>
                  </tr>
                ) : (
                  managers.map((manager: any) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* This would come from an API call in a real implementation */}
                        {Math.floor(Math.random() * 5)}
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
                            <DropdownMenuItem onClick={() => setManagerToUpdate(manager.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  {manager.isActive ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {manager.isActive ? "Deactivate Manager" : "Activate Manager"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {manager.isActive
                                      ? "Are you sure you want to deactivate this manager? They will no longer be able to access the system."
                                      : "Are you sure you want to activate this manager? They will be able to access the system."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleToggleActivation(manager.id, manager.isActive)}
                                  >
                                    {manager.isActive ? "Deactivate" : "Activate"}
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
