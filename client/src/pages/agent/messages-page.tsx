import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Send } from "lucide-react";

export default function AgentMessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageContent, setMessageContent] = useState<string>("");

  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages"],
  });

  // Fetch available receivers (just SalesStaff for agents)
  const { data: receivers = [], isLoading: isLoadingReceivers } = useQuery({
    queryKey: ["/api/users/available-receivers"],
  });

  // For agents, there's only one person they can message: their SalesStaff
  const salesStaff = receivers[0];

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
    if (!salesStaff || !messageContent.trim()) {
      toast({
        title: "Cannot send message",
        description: salesStaff ? "Please enter a message." : "No sales staff assigned to you.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      receiverId: salesStaff.id,
      content: messageContent
    });
  };

  // Sort messages by date
  const sortedMessages = [...messages].sort((a: any, b: any) => 
    new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
  );

  if (!user || (user.role !== "Agent" && user.role !== "TeamLeader")) {
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

      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200 flex-row justify-between items-center">
          <CardTitle>
            {isLoadingReceivers ? (
              "Loading..."
            ) : salesStaff ? (
              `Conversation with ${salesStaff.firstName} ${salesStaff.lastName} (Sales Staff)`
            ) : (
              "No Sales Staff Assigned"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] flex flex-col">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Loading messages...
            </div>
          ) : !salesStaff ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              You don't have a sales staff assigned to message. Please contact your administrator.
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No messages yet. Start the conversation with your sales staff.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto py-4">
              {sortedMessages.map((message: any) => (
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
                      {format(new Date(message.sentAt), 'h:mm a, MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4">
          <div className="flex w-full space-x-2">
            <Textarea 
              placeholder="Type your message..." 
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="flex-1"
              disabled={!salesStaff}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!salesStaff || !messageContent.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Message Guidelines Card */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Communication Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">Reporting Issues</p>
              <p className="text-sm text-gray-500">
                Use the messaging system to report any issues you encounter in the field, 
                or questions about client policies and procedures.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-900">Response Times</p>
              <p className="text-sm text-gray-500">
                Your sales staff will typically respond within 2 business hours. 
                For urgent matters, please call the office directly.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-900">Message Content</p>
              <p className="text-sm text-gray-500">
                Keep messages professional and concise. Include relevant details such as client names,
                policy numbers, or specific locations when discussing cases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
