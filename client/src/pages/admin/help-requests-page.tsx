import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function HelpRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch help requests
  const { data: helpRequests = [], isLoading } = useQuery({
    queryKey: ["/api/admin/help-requests"],
  });

  // Resolve help request mutation
  const resolveHelpRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/help-requests/${id}/resolve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/help-requests"] });
      toast({
        title: "Help request resolved",
        description: "The help request has been marked as resolved.",
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

  const handleResolve = (id: number) => {
    resolveHelpRequestMutation.mutate(id);
  };

  // Filter help requests
  const pendingRequests = helpRequests.filter((request: any) => !request.resolved);
  const resolvedRequests = helpRequests.filter((request: any) => request.resolved);

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
    <Layout title="Help Requests">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Help Requests</h1>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved {resolvedRequests.length > 0 && `(${resolvedRequests.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle>Pending Help Requests</CardTitle>
              <CardDescription>User assistance requests that need attention</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="py-8 text-center">Loading help requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No pending help requests. All caught up!
                </div>
              ) : (
                pendingRequests.map((request: any) => (
                  <div key={request.id} className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-900">From: {request.name}</h4>
                          <Badge className="ml-2" variant="secondary">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Email: {request.email}</p>
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 mb-2">
                          {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        <Button 
                          onClick={() => handleResolve(request.id)} 
                          disabled={resolveHelpRequestMutation.isPending}
                        >
                          {resolveHelpRequestMutation.isPending ? "Resolving..." : "Resolve"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resolved">
          <Card>
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle>Resolved Help Requests</CardTitle>
              <CardDescription>Previously addressed user assistance requests</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-gray-200">
              {isLoading ? (
                <div className="py-8 text-center">Loading help requests...</div>
              ) : resolvedRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No resolved help requests found.
                </div>
              ) : (
                resolvedRequests.map((request: any) => (
                  <div key={request.id} className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-900">From: {request.name}</h4>
                          <Badge className="ml-2" variant="outline">Resolved</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">Email: {request.email}</p>
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">
                          {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
