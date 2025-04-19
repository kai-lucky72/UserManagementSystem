import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/team-leader/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, User } from 'lucide-react';
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
import { Mail, Phone, Clock } from 'lucide-react';


export default function TeamLeaderMembersPage() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/api/leader/group-members"],
    enabled: !!user
  });

  const openMemberDetails = (member: any) => {
    setSelectedMember(member);
    setIsViewDetailsOpen(true);
  };

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

  return (
    <Layout title="Team Members">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
      </div>

      {isLoadingMembers ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
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
        <Card>
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>Team Members List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Work ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.firstName} {member.lastName}</TableCell>
                    <TableCell>{member.workId}</TableCell>
                    <TableCell>{member.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{new Date(member.lastActive).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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