import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/team-leader/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Users, ClipboardList, Clock, Calendar, Check, Zap } from 'lucide-react';

export default function TeamLeaderDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Get team members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['/api/leader/group-members'],
    enabled: !!user
  });

  // Check attendance
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/agent/attendance', today],
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  // Check reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['/api/agent/daily-reports', today],
    enabled: !!user,
    refetchOnWindowFocus: false
  });

  // Submit attendance mutation
  const submitAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/agent/attendance', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/attendance', today] });
      toast({
        title: 'Attendance submitted',
        description: 'Your attendance has been recorded successfully.',
      });
      setIsSubmittingAttendance(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit attendance',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmittingAttendance(false);
    }
  });

  // Submit attendance function
  const handleSubmitAttendance = () => {
    setIsSubmittingAttendance(true);
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          submitAttendanceMutation.mutate({
            checkInTime: new Date(),
            location: `${latitude},${longitude}`,
            sector: 'Office' // Default sector
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Submit without location
          submitAttendanceMutation.mutate({
            checkInTime: new Date(),
            sector: 'Office' // Default sector
          });
        }
      );
    } else {
      // Geolocation not supported
      submitAttendanceMutation.mutate({
        checkInTime: new Date(),
        sector: 'Office' // Default sector
      });
    }
  };

  // Has already submitted attendance today?
  const hasSubmittedAttendance = !!attendance;
  
  // Has already submitted report today?
  const hasSubmittedReport = !!reports;

  // Metrics for the dashboard
  const totalMembers = members?.length || 0;
  const activeClients = 0; // This would come from an API
  const pendingTasks = 0; // This would come from an API

  if (!user || user.role !== 'TeamLeader') {
    return (
      <Layout title="Unauthorized">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-semibold mb-2">Unauthorized Access</h1>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </Layout>
    );
  }

  const isLoading = isLoadingMembers || isLoadingAttendance || isLoadingReports;

  return (
    <Layout title="Dashboard">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{isLoading ? '...' : totalMembers}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold flex items-center">
                {hasSubmittedAttendance ? (
                  <>
                    <Check className="h-5 w-5 text-green-500 mr-1" />
                    <span>Checked In</span>
                  </>
                ) : (
                  'Not Checked In'
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ClipboardList className="h-4 w-4 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold flex items-center">
                {hasSubmittedReport ? (
                  <>
                    <Check className="h-5 w-5 text-green-500 mr-1" />
                    <span>Submitted</span>
                  </>
                ) : (
                  'Not Submitted'
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your daily team activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasSubmittedAttendance && (
              <Button 
                className="w-full flex items-center justify-center" 
                onClick={handleSubmitAttendance}
                disabled={isSubmittingAttendance}
              >
                {isSubmittingAttendance ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Check In Attendance
              </Button>
            )}

            <Button 
              className="w-full flex items-center justify-center" 
              variant={hasSubmittedReport ? "outline" : "default"}
              onClick={() => window.location.href = '/team-leader/reports'}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {hasSubmittedReport ? 'View Today\'s Report' : 'Submit Daily Report'}
            </Button>

            <Button 
              className="w-full flex items-center justify-center" 
              variant="outline"
              onClick={() => window.location.href = '/team-leader/members'}
            >
              <Users className="h-4 w-4 mr-2" />
              View Team Members
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Overview</CardTitle>
            <CardDescription>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center my-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-1">Team Status</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalMembers > 0 ? 100 : 0}%` }}></div>
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">{totalMembers > 0 ? 'Active' : 'No members'}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Team Members</p>
                      <p className="text-lg font-semibold">{totalMembers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Reports</p>
                      <p className="text-lg font-semibold">{hasSubmittedReport ? '1' : '0'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button variant="ghost" className="w-full justify-center" onClick={() => window.location.href = '/team-leader/reports'}>
              View All Reports
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}