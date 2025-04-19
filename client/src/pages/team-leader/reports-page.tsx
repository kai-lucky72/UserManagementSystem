import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/team-leader/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, FileText, Check, Calendar, Info } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Report form schema
const reportSchema = z.object({
  comment: z.string().min(10, 'Comment must be at least 10 characters long'),
  clientsVisited: z.string().min(1, 'Please enter the number of clients visited'),
  leadsGenerated: z.string().min(1, 'Please enter the number of leads generated'),
  salesClosed: z.string().min(1, 'Please enter the number of sales closed'),
  commissionEarned: z.string().min(1, 'Please enter the commission earned')
});

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get team members
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['/api/leader/group-members'],
    enabled: !!user
  });

  // Check if report already exists for today
  const { data: existingReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['/api/agent/daily-reports', today],
    enabled: !!user
  });

  // Setup form
  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      comment: '',
      clientsVisited: '0',
      leadsGenerated: '0',
      salesClosed: '0',
      commissionEarned: '0'
    }
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reportSchema>) => {
      // Format clientsData
      const clientsData = {
        clientsVisited: parseInt(data.clientsVisited),
        leadsGenerated: parseInt(data.leadsGenerated),
        salesClosed: parseInt(data.salesClosed),
        commissionEarned: parseFloat(data.commissionEarned)
      };
      
      const res = await apiRequest('POST', '/api/leader/daily-reports', {
        comment: data.comment,
        clientsData
      });
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent/daily-reports', today] });
      toast({
        title: 'Report submitted',
        description: 'Your daily report has been submitted successfully.',
      });
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit report',
        description: error.message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = (data: z.infer<typeof reportSchema>) => {
    setIsSubmitting(true);
    submitReportMutation.mutate(data);
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

  const isLoading = isLoadingMembers || isLoadingReport;
  const totalAgents = members?.length || 0;
  const hasSubmittedToday = !!existingReport;
  
  // Format existing report data if available
  const formattedReport = existingReport ? {
    ...existingReport,
    clientsData: typeof existingReport.clientsData === 'string' 
      ? JSON.parse(existingReport.clientsData) 
      : existingReport.clientsData
  } : null;

  return (
    <Layout title="Daily Reports">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Team Daily Reports</h1>
        <p className="text-sm text-muted-foreground">
          Submit and manage your team's daily activity reports
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {hasSubmittedToday ? 'Today\'s Report' : 'Submit Daily Report'}
                </CardTitle>
                <CardDescription>
                  {hasSubmittedToday 
                    ? `Report submitted on ${new Date(formattedReport?.createdAt || '').toLocaleString()}`
                    : `Report for ${new Date().toLocaleDateString()}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasSubmittedToday ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Report Already Submitted</AlertTitle>
                      <AlertDescription>
                        You have already submitted a report for today.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">Comment</h3>
                        <p className="mt-1 text-sm">{formattedReport?.comment}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Team Performance</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-muted-foreground">Clients Visited</p>
                            <p className="text-lg font-semibold">
                              {formattedReport?.clientsData?.clientsVisited || 0}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-muted-foreground">Leads Generated</p>
                            <p className="text-lg font-semibold">
                              {formattedReport?.clientsData?.leadsGenerated || 0}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-muted-foreground">Sales Closed</p>
                            <p className="text-lg font-semibold">
                              {formattedReport?.clientsData?.salesClosed || 0}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-muted-foreground">Commission Earned</p>
                            <p className="text-lg font-semibold">
                              ${formattedReport?.clientsData?.commissionEarned || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Report Summary</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide a summary of your team's performance today..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include any challenges, achievements, or areas that need attention.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-4">Team Performance Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="clientsVisited"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clients Visited</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="leadsGenerated"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Leads Generated</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="salesClosed"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sales Closed</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="commissionEarned"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commission Earned ($)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Submit Team Report
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Team Overview</CardTitle>
                <CardDescription>
                  {totalAgents} team member{totalAgents !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Today's Reporting</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Team Leader Report</span>
                      <span>
                        {hasSubmittedToday ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Not submitted</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Team Information</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Members</span>
                      <span className="font-medium">{totalAgents}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reporting Cycle</span>
                      <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">
                        Daily
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full flex items-center justify-center" onClick={() => window.location.href = '/team-leader/members'}>
                  View Team Members
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}