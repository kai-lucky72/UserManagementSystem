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
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "manager" | "salesStaff" | "agent";
  endpoint: string;
  additionalFields?: Record<string, any>;
}

export default function CreateUserDialog({ 
  isOpen, 
  onClose, 
  userType, 
  endpoint,
  additionalFields = {}
}: CreateUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  let roleOptions: string[] = [];
  let title = "";
  let description = "";
  
  switch (userType) {
    case "manager":
      title = "Create Manager";
      description = "Add a new manager to the system";
      roleOptions = ["Manager"];
      break;
    case "salesStaff":
      title = "Create Sales Staff";
      description = "Add a new sales staff member to your team";
      roleOptions = ["SalesStaff"];
      break;
    case "agent":
      title = "Create Agent";
      description = "Add a new agent or team leader to your team";
      roleOptions = ["Agent", "TeamLeader"];
      break;
  }
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema.extend({
      confirmPassword: insertUserSchema.shape.password
    }).refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    })),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      workId: "",
      password: "",
      role: roleOptions[0],
      ...additionalFields
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      // Remove the confirmPassword field before sending
      const { confirmPassword, ...userData } = data as any;
      const res = await apiRequest("POST", endpoint, userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created successfully",
        description: `The ${userType} has been added to the system.`,
      });
      form.reset();
      onClose();
      
      // Invalidate relevant queries
      if (userType === "manager") {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/managers"] });
      } else if (userType === "salesStaff") {
        queryClient.invalidateQueries({ queryKey: ["/api/manager/sales-staff"] });
      } else if (userType === "agent") {
        queryClient.invalidateQueries({ queryKey: ["/api/sales-staff/agents"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    createUserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="workId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter work ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {userType === "agent" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
