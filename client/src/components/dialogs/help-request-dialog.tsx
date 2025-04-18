import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertHelpRequestSchema, InsertHelpRequest } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface HelpRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpRequestDialog({ isOpen, onClose }: HelpRequestDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertHelpRequest>({
    resolver: zodResolver(insertHelpRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });

  const helpRequestMutation = useMutation({
    mutationFn: async (data: InsertHelpRequest) => {
      const res = await apiRequest("POST", "/api/help-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Help request submitted",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit help request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHelpRequest) => {
    helpRequestMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Help</DialogTitle>
          <DialogDescription>
            Fill out the form below and our team will get back to you.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How can we help?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your issue or question" 
                      className="resize-none" 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={helpRequestMutation.isPending}
              >
                {helpRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
