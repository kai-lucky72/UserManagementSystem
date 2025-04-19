import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Clock, User, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function ActivityLog() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<{activities: Activity[], total: number}>({
    queryKey: ["/api/admin/activities", page, limit],
  });

  const activities = data?.activities || [];
  const totalPages = data?.total ? Math.ceil(data.total / limit) : 1;

  // Generate activity type badge
  const getActivityBadge = (action: string) => {
    switch(action) {
      case "login":
        return <Badge variant="default">Login</Badge>;
      case "logout":
        return <Badge variant="outline">Logout</Badge>;
      case "create_user":
        return <Badge variant="success">User Created</Badge>;
      case "update_user":
        return <Badge variant="warning">User Updated</Badge>;
      case "create_group":
        return <Badge variant="success">Group Created</Badge>;
      case "assign_agent":
        return <Badge variant="secondary">Agent Assigned</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8 text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Error loading activity log</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle>System Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No activities recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <User className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">
                        {activity.userName} ({activity.userRole})
                      </p>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {getActivityBadge(activity.action)}
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="py-4 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}