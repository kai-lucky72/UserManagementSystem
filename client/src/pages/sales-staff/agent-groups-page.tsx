import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, UserPlus, UserCheck, MessageSquare, MoreHorizontal, 
  Edit, XCircle, UserCog, Shield, User 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for creating a team leader
const createTeamLeaderSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  workId: z.string().min(1, "Work ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  nationalId: z.string().optional(),
  role: z.literal("TeamLeader"),
  assignAgents: z.array(z.string()).optional(),
  groupName: z.string().min(1, "Group name is required"),
});

// Schema for creating a group using existing team leader
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  leaderId: z.string().min(1, "Team leader is required"),
});

export default function AgentGroupsPage() {
  const { user } = useAuth();
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isViewMembersDialogOpen, setIsViewMembersDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent groups
  const { data: agentGroups = [], isLoading } = useQuery({
    queryKey: ["/api/sales-staff/agent-groups"],
  });

  // Fetch agents for dropdown
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/sales-staff/agents"],
  });

  // Fetch group members when a group is selected
  const { data: groupMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/api/sales-staff/agent-groups", selectedGroupId, "members"],
    enabled: !!selectedGroupId,
  });

  // Team leaders (for group creation)
  const teamLeaders = agents.filter((agent: any) => agent.role === "TeamLeader");
  
  // Form for creating a group with existing team leader
  const groupForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      leaderId: "", 
    },
  });

  // Form for creating a new team leader and group
  const teamLeaderForm = useForm<z.infer<typeof createTeamLeaderSchema>>({
    resolver: zodResolver(createTeamLeaderSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      workId: "",
      password: "",
      phoneNumber: "",
      nationalId: "",
      role: "TeamLeader",
      assignAgents: [],
      groupName: "",
    },
  });

  // Create a new team leader and group mutation
  const createTeamLeaderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeamLeaderSchema>) => {
      // First create the team leader
      const leaderRes = await apiRequest("POST", "/api/sales-staff/agents", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        workId: data.workId,
        password: data.password,
        phoneNumber: data.phoneNumber || undefined,
        nationalId: data.nationalId || undefined,
        role: "TeamLeader"
      });
      
      const leader = await leaderRes.json();
      
      // Then create the group with this leader
      const groupRes = await apiRequest("POST", "/api/sales-staff/agent-groups", {
        name: data.groupName,
        leaderId: leader.id
      });
      
      const group = await groupRes.json();
      
      // Finally, add selected agents to the group
      if (data.assignAgents && data.assignAgents.length > 0) {
        for (const agentId of data.assignAgents) {
          await apiRequest("POST", `/api/sales-staff/agent-groups/${group.id}/members`, {
            agentId: parseInt(agentId)
          });
        }
      }
      
      return { leader, group };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agent-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agents"] });
      setIsCreateGroupDialogOpen(false);
      teamLeaderForm.reset();
      setSelectedAgents([]);
      toast({
        title: "Team leader and group created",
        description: "The team leader and agent group have been created successfully.",
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

  // Create group with existing team leader mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createGroupSchema>) => {
      const payload = {
        name: data.name,
        leaderId: parseInt(data.leaderId),
      };
      const res = await apiRequest("POST", "/api/sales-staff/agent-groups", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agent-groups"] });
      setIsCreateGroupDialogOpen(false);
      groupForm.reset();
      toast({
        title: "Group created",
        description: "The agent group has been created successfully.",
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

  // Add member to group mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, agentId }: { groupId: number; agentId: number }) => {
      const res = await apiRequest("POST", `/api/sales-staff/agent-groups/${groupId}/members`, { agentId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agent-groups", selectedGroupId, "members"] });
      setIsAddMemberDialogOpen(false);
      toast({
        title: "Member added",
        description: "The agent has been added to the group successfully.",
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

  // Remove member from group mutation  
  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, agentId }: { groupId: number; agentId: number }) => {
      // Use DELETE method to remove an agent from a group
      const res = await apiRequest("DELETE", `/api/sales-staff/agent-groups/${groupId}/members/${agentId}`, {});
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agent-groups", selectedGroupId, "members"] });
      toast({
        title: "Member removed",
        description: "The agent has been removed from the group successfully.",
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

  const onSubmitExistingLeader = (data: z.infer<typeof createGroupSchema>) => {
    createGroupMutation.mutate(data);
  };

  const onSubmitNewTeamLeader = (data: z.infer<typeof createTeamLeaderSchema>) => {
    createTeamLeaderMutation.mutate({
      ...data,
      assignAgents: selectedAgents
    });
  };

  const getSelectedGroup = () => {
    return agentGroups.find((group: any) => group.id === selectedGroupId);
  };

  // Only regular agents (not team leaders)
  const regularAgents = agents.filter((agent: any) => agent.role === "Agent");

  // Filter out agents who are already in the group
  const availableAgents = agents.filter((agent: any) => {
    // Only regular agents, not team leaders
    if (agent.role !== "Agent") return false;
    
    // Check if the agent is already in the group
    if (selectedGroupId && groupMembers.some((member: any) => member.id === agent.id)) {
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
    <Layout title="Agent Groups">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Agent Groups</h1>
        <Button 
          onClick={() => setIsCreateGroupDialogOpen(true)}
          className="inline-flex items-center"
        >
          <Users className="mr-2 h-4 w-4" /> Create Agent Group
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading agent groups...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentGroups.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No agent groups found. Create your first group to get started.</p>
            </div>
          ) : (
            agentGroups.map((group: any) => (
              <Card key={group.id} className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="absolute right-4 top-4">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedGroupId(group.id);
                      setIsAddMemberDialogOpen(true);
                    }}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Member
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message Group
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Deactivate Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        Team Leader: {
                          teamLeaders.find((leader: any) => leader.id === group.leaderId)
                            ? `${teamLeaders.find((leader: any) => leader.id === group.leaderId).firstName} ${teamLeaders.find((leader: any) => leader.id === group.leaderId).lastName}`
                            : "Not Assigned"
                        }
                      </CardDescription>
                    </div>
                    <Badge variant={group.isActive ? "success" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Button 
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setIsViewMembersDialogOpen(true);
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Members
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Group or Team Leader Dialog */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Team Leader & Agent Group</DialogTitle>
            <DialogDescription>
              Create a new team leader, assign agents, and organize them into a group.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="create-team-leader" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create-team-leader" className="flex items-center">
                <UserCog className="mr-2 h-4 w-4" /> 
                Create New Team Leader
              </TabsTrigger>
              <TabsTrigger value="existing-leader" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Use Existing Team Leader
              </TabsTrigger>
            </TabsList>
            
            {/* Tab for creating a new team leader */}
            <TabsContent value="create-team-leader" className="mt-4">
              <Form {...teamLeaderForm}>
                <form onSubmit={teamLeaderForm.handleSubmit(onSubmitNewTeamLeader)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={teamLeaderForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="workId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work ID</FormLabel>
                          <FormControl>
                            <Input placeholder="TL001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="nationalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="ID12345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamLeaderForm.control}
                      name="groupName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Sales Team Alpha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <Label>Assign Agents to this Team Leader</Label>
                    <div className="mt-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                      {regularAgents.length === 0 ? (
                        <p className="text-sm text-gray-500">No agents available to assign</p>
                      ) : (
                        <div className="space-y-2">
                          {regularAgents.map((agent: any) => (
                            <div key={agent.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`agent-${agent.id}`}
                                checked={selectedAgents.includes(agent.id.toString())}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedAgents([...selectedAgents, agent.id.toString()]);
                                  } else {
                                    setSelectedAgents(selectedAgents.filter(id => id !== agent.id.toString()));
                                  }
                                }}
                              />
                              <Label htmlFor={`agent-${agent.id}`} className="text-sm font-normal cursor-pointer">
                                {agent.firstName} {agent.lastName} ({agent.workId})
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateGroupDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTeamLeaderMutation.isPending}>
                      {createTeamLeaderMutation.isPending ? "Creating..." : "Create Team Leader & Group"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            
            {/* Tab for using an existing team leader */}
            <TabsContent value="existing-leader" className="mt-4">
              <Form {...groupForm}>
                <form onSubmit={groupForm.handleSubmit(onSubmitExistingLeader)} className="space-y-4">
                  <FormField
                    control={groupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter group name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={groupForm.control}
                    name="leaderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Leader</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a team leader" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teamLeaders.length === 0 ? (
                              <p className="p-2 text-sm text-gray-500">No team leaders available. Create one first.</p>
                            ) : (
                              teamLeaders.map((leader: any) => (
                                <SelectItem key={leader.id} value={leader.id.toString()}>
                                  {leader.firstName} {leader.lastName} ({leader.workId})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateGroupDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createGroupMutation.isPending || teamLeaders.length === 0}>
                      {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={isViewMembersDialogOpen} onOpenChange={setIsViewMembersDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription>
              {getSelectedGroup()?.name || 'Group'} members
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {isLoadingMembers ? (
              <div className="text-center py-4">Loading members...</div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No members in this group yet. Add some members to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {groupMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <span>{member.firstName[0]}{member.lastName[0]}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        if (selectedGroupId) {
                          removeMemberMutation.mutate({
                            groupId: selectedGroupId,
                            agentId: member.id
                          });
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setIsViewMembersDialogOpen(false);
                setIsAddMemberDialogOpen(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Group</DialogTitle>
            <DialogDescription>
              Add an agent to {getSelectedGroup()?.name || 'this group'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Label htmlFor="agent">Select Agent</Label>
            <Select
              onValueChange={(value) => {
                if (selectedGroupId) {
                  addMemberMutation.mutate({ 
                    groupId: selectedGroupId, 
                    agentId: parseInt(value) 
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">No available agents</p>
                ) : (
                  availableAgents.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.firstName} {agent.lastName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
