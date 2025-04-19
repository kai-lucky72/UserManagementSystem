import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoginData, loginSchema } from "@shared/schema";
import { useLocation } from "wouter";
import HelpRequestDialog from "@/components/dialogs/help-request-dialog";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);

  // Use effect for redirection to avoid React hook errors
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // If user is logged in, show empty div while redirecting
  if (user) return <div className="min-h-screen bg-gray-50"></div>;

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      workId: "",
      email: "",
      password: ""
    }
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Agent Management System</h1>
              <p className="text-gray-500">Sign in to your account</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="workId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ADM001" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g. admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button 
                    className="w-full" 
                    type="submit" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
                
                <div className="mt-4 text-center">
                  <button 
                    type="button"
                    onClick={() => setIsHelpDialogOpen(true)}
                    className="text-sm text-primary hover:text-blue-700"
                  >
                    Need help? Contact administrator
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default credentials for test:</p>
          <p>Admin - workId: ADM001, email: admin@example.com, password: admin123</p>
          <p>Manager - workId: MGR001, email: manager@example.com, password: manager123</p>
          <p>SalesStaff - workId: SLF001, email: sales@example.com, password: sales123</p>
          <p>Agent - workId: AGT001, email: agent@example.com, password: agent123</p>
        </div>
      </div>
      
      <HelpRequestDialog
        isOpen={isHelpDialogOpen}
        onClose={() => setIsHelpDialogOpen(false)}
      />
    </div>
  );
}
