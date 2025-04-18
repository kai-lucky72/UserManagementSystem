import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SalesStaffMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");

  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages"],
  });

  // Fetch available receivers (Agents, TeamLeaders, and Manager)
  const { data: receivers = [], isLoading: isLoadingReceivers } = useQuery({
    queryKey: ["/api/users/available-receivers"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageContent("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedReceiverId || !messageContent.trim()) {
      toast({
        title: "Cannot send message",
        description: "Please select a recipient and enter a message.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: parseInt(selectedReceiverId),
      content: messageContent
    });
  };

  // Group messages by conversation
  const conversations = messages.reduce((acc: any, message: any) => {
    const otherPersonId = message.senderId === user?.id ? message.receiverId : message.senderId;
    
    if (!acc[otherPersonId]) {
      acc[otherPersonId] = {
        otherPerson: otherPersonId === message.senderId ? message.sender : message.receiver,
        messages: []
      };
    }
    
    acc[otherPersonId].messages.push(message);
    // Sort messages by date
    acc[otherPersonId].messages.sort((a: any, b: any) => 
      new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    );
    
    return acc;
  }, {});

  // Get recipient role label
  const getRecipientRoleLabel = (role: string) => {
    switch (role) {
      case "Agent":
        return "Agent";
      case "TeamLeader":
        return "Team Leader";
      case "Manager":
        return "Manager";
      default:
        return role;
    }
  };

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
    <Layout title="Messages">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingMessages ? (
              <div className="p-6 text-center">Loading conversations...</div>
            ) : Object.keys(conversations).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No conversations yet. Start a new message.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.entries(conversations).map(([personId, data]: [string, any]) => (
                  <div 
                    key={personId} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedReceiverId === personId ? 'bg-gray-100' : ''}`}
                    onClick={() => setSelectedReceiverId(personId)}
                  >
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full ${
                        data.otherPerson?.role === 'Manager' ? 'bg-blue-100 text-blue-600' :
                        data.otherPerson?.role === 'TeamLeader' ? 'bg-amber-100 text-amber-600' : 
                        'bg-green-100 text-green-600'
                      } flex items-center justify-center`}>
                        <span className="font-medium">
                          {data.otherPerson?.firstName?.[0]}{data.otherPerson?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {data.otherPerson?.firstName} {data.otherPerson?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRecipientRoleLabel(data.otherPerson?.role)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {data.messages[data.messages.length - 1].content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(data.messages[data.messages.length - 1].sentAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedReceiverId && conversations[selectedReceiverId] 
                  ? `${conversations[selectedReceiverId].otherPerson?.firstName} ${conversations[selectedReceiverId].otherPerson?.lastName}`
                  : "New Message"
                }
              </CardTitle>
              {!selectedReceiverId && (
                <div className="w-64">
                  <Select
                    value={selectedReceiverId}
                    onValueChange={setSelectedReceiverId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {receivers.map((receiver: any) => (
                        <SelectItem key={receiver.id} value={receiver.id.toString()}>
                          {receiver.firstName} {receiver.lastName} ({getRecipientRoleLabel(receiver.role)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] flex flex-col">
            {!selectedReceiverId ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation or start a new message
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4">
                  {conversations[selectedReceiverId]?.messages.map((message: any) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.senderId === user.id 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.senderId === user.id ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                          {format(new Date(message.sentAt), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="flex w-full space-x-2">
              <Textarea 
                placeholder="Type your message..." 
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="flex-1"
                disabled={!selectedReceiverId}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!selectedReceiverId || !messageContent.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
