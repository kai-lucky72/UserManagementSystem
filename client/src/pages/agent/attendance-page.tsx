import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/common/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LOCATIONS = [
  "Downtown",
  "North District",
  "South District",
  "East District",
  "West District",
  "Central Mall",
  "Business Park",
  "Industrial Zone",
  "Residential Area"
];

const SECTORS = [
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Technology",
  "Manufacturing",
  "Service",
  "Transportation"
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [checkInData, setCheckInData] = useState({
    location: "",
    sector: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const todayDate = new Date();
  
  // Format date for display
  const formattedDate = format(todayDate, 'EEEE, MMMM d, yyyy');

  // Fetch today's attendance
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["/api/agent/attendance"],
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/agent/attendance", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/attendance"] });
      setIsCheckInDialogOpen(false);
      toast({
        title: "Check-in successful",
        description: "Your attendance has been recorded for today.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    if (!checkInData.location) {
      toast({
        title: "Location required",
        description: "Please select your current location.",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({
      location: checkInData.location,
      sector: checkInData.sector || undefined,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const hasCheckedIn = !!attendance;
  const checkInTime = attendance ? new Date(attendance.checkInTime) : null;

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
    <Layout title="Attendance">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
        <Button 
          onClick={() => setIsCheckInDialogOpen(true)}
          className="inline-flex items-center"
          disabled={hasCheckedIn}
        >
          <CheckCircle className="mr-2 h-4 w-4" /> 
          {hasCheckedIn ? "Already Checked In" : "Check In"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Status Card */}
        <Card className={cn(
          "col-span-1 lg:col-span-2",
          hasCheckedIn ? "border-green-200" : ""
        )}>
          <CardHeader className={cn(
            "flex flex-row items-center justify-between",
            hasCheckedIn ? "bg-green-50" : "bg-gray-50"
          )}>
            <div>
              <CardTitle>Today's Status</CardTitle>
              <CardDescription>{formattedDate}</CardDescription>
            </div>
            {hasCheckedIn && (
              <Badge variant="success" className="text-sm py-1">
                Checked In
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingAttendance ? (
              <div className="text-center py-8">Loading attendance status...</div>
            ) : hasCheckedIn ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Check-in Time</p>
                    <p className="text-lg font-semibold">{checkInTime ? format(checkInTime, 'h:mm a') : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-lg font-semibold">{attendance.location || 'Not specified'}</p>
                  </div>
                </div>
                
                {attendance.sector && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sector</p>
                      <p className="text-lg font-semibold">{attendance.sector}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't checked in today.</p>
                <Button 
                  onClick={() => setIsCheckInDialogOpen(true)}
                  className="inline-flex items-center"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> 
                  Check In Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Info Card */}
        <Card className="col-span-1">
          <CardHeader className="bg-gray-50">
            <CardTitle>Attendance Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Expected check-in:</span>
                <span className="text-sm">9:00 AM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Regular hours:</span>
                <span className="text-sm">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Work days:</span>
                <span className="text-sm">Monday - Friday</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Status today:</span>
                <Badge variant={hasCheckedIn ? "success" : "secondary"}>
                  {hasCheckedIn ? "Present" : "Not Checked In"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Card */}
      <Card>
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-8 text-gray-500">
            Attendance history will be available soon.
          </div>
        </CardContent>
      </Card>

      {/* Check In Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check In for Today</DialogTitle>
            <DialogDescription>
              Record your attendance for {formattedDate}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Select
                value={checkInData.location}
                onValueChange={(value) => setCheckInData({...checkInData, location: value})}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Sector (Optional)</Label>
              <Select
                value={checkInData.sector}
                onValueChange={(value) => setCheckInData({...checkInData, sector: value})}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information"
                value={checkInData.notes}
                onChange={(e) => setCheckInData({...checkInData, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCheckIn} disabled={checkInMutation.isPending}>
              {checkInMutation.isPending ? "Checking in..." : "Check In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
