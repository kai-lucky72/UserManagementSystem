import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/team-leader/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Phone, Mail, User, MapPin, Clock } from 'lucide-react';

export default function MembersPage() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  // Get team members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['/api/leader/group-members'],
    enabled: !!user
  });

  // Get attendance data for today
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/agent/attendance', today],
    enabled: !!user
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

  const openMemberDetails = (member: any) => {
    setSelectedMember(member);
    setIsViewDetailsOpen(true);
  };

  const isLoading = isLoadingMembers || isLoadingAttendance;

  return (
    <Layout title="Team Members">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your team members ({isLoadingMembers ? '...' : members?.length || 0} members)
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : members?.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-white">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Team Members</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your team doesn't have any members yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members?.map((member: any) => (
            <Card key={member.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.firstName} {member.lastName}</CardTitle>
                      <CardDescription>{member.workId}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={member.isActive ? "default" : "secondary"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>{member.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center col-span-2">
                    <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                    <span>
                      {attendanceData?.some((a: any) => a.userId === member.id) 
                        ? 'Checked in today' 
                        : 'Not checked in today'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex justify-between w-full">
                  <Button variant="outline" size="sm" onClick={() => openMemberDetails(member)}>
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" /> Message
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Member Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
            <DialogDescription>
              Information about {selectedMember?.firstName} {selectedMember?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {selectedMember.firstName[0]}{selectedMember.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.firstName} {selectedMember.lastName}</h3>
                  <p className="text-muted-foreground">{selectedMember.role} - {selectedMember.workId}</p>
                  <Badge className="mt-1" variant={selectedMember.isActive ? "default" : "secondary"}>
                    {selectedMember.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-muted-foreground mr-3" />
                  <span>{selectedMember.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-muted-foreground mr-3" />
                  <span>{selectedMember.phoneNumber || 'Not provided'}</span>
                </div>
                {selectedMember.nationalId && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-muted-foreground mr-3" />
                    <span>ID: {selectedMember.nationalId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline" 
              onClick={() => setIsViewDetailsOpen(false)}
            >
              Close
            </Button>
            <Button className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}