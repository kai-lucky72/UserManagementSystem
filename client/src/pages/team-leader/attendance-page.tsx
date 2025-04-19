import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/team-leader/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Check, AlertTriangle, Loader2, MapPin, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  checkInTime: string;
  sector: string | null;
  location: string | null;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isViewMapOpen, setIsViewMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Get team members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['/api/leader/group-members'],
    enabled: !!user
  });

  // Get attendance for selected date
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/agent/attendance', formattedDate],
    enabled: !!user && !!formattedDate
  });

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

  const isLoading = isLoadingMembers || isLoadingAttendance;
  const isToday = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : false;

  // Function to view location on map
  const viewLocation = (location: string) => {
    setSelectedLocation(location);
    setIsViewMapOpen(true);
  };

  // Get member name by userId
  const getMemberName = (userId: number) => {
    const member = members?.find((m: any) => m.id === userId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  // Check if member has checked in on selected date
  const hasCheckedIn = (userId: number) => {
    return attendanceData?.some((a: any) => a.userId === userId);
  };

  // Get attendance record for a member
  const getAttendanceRecord = (userId: number) => {
    return attendanceData?.find((a: any) => a.userId === userId);
  };

  // Format coordinates for embedding in map
  const formatMapUrl = (location: string) => {
    if (!location) return null;
    
    // Check if location is in format "lat,lng"
    const coords = location.split(',').map(coord => parseFloat(coord.trim()));
    
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      // Format as a Google Maps embed URL
      return `https://maps.google.com/maps?q=${coords[0]},${coords[1]}&z=15&output=embed`;
    }
    
    // If not coordinates, just encode the location string
    return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=15&output=embed`;
  };

  return (
    <Layout title="Team Attendance">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Team Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Track and monitor your team's attendance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>
              {selectedDate 
                ? `Attendance for ${format(selectedDate, 'MMMM d, yyyy')}` 
                : 'Select a date to view attendance'
              }
              {isToday && ' (Today)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center my-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : members?.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No team members found</p>
              </div>
            ) : (
              <div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members?.map((member: any) => {
                        const attendance = getAttendanceRecord(member.id);
                        return (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs">
                                    {member.firstName[0]}{member.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.firstName} {member.lastName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {hasCheckedIn(member.id) ? (
                                <Badge className="bg-green-500">
                                  <Check className="h-3 w-3 mr-1" /> Present
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Absent
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {attendance?.checkInTime 
                                ? format(new Date(attendance.checkInTime), 'h:mm a')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              {attendance?.location ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-blue-500"
                                  onClick={() => viewLocation(attendance.location!)}
                                >
                                  <MapPin className="h-3 w-3 mr-1" /> View
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {members.length} team member{members.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-xs">Present</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <span className="text-xs">Absent</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              Choose a date to view attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="border rounded-md p-3"
            />
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Attendance Summary</h3>
              
              {isLoading ? (
                <div className="h-[100px] flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Members</span>
                    <span className="font-medium">{members?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Present</span>
                    <span className="font-medium">
                      {attendanceData?.length || 0} / {members?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Absent</span>
                    <span className="font-medium">
                      {(members?.length || 0) - (attendanceData?.length || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Viewer Dialog */}
      <Dialog open={isViewMapOpen} onOpenChange={setIsViewMapOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
            <DialogDescription>
              Attendance check-in location
            </DialogDescription>
          </DialogHeader>
          
          <div className="h-[300px] w-full border rounded-md overflow-hidden">
            {selectedLocation && (
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={formatMapUrl(selectedLocation)}
              ></iframe>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}