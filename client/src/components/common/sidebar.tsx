import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCog,
  Users,
  HelpCircle,
  Settings,
  UserCheck,
  BarChart,
  MessageSquare,
  UserPlus,
  UsersRound,
  CalendarCheck,
  ClipboardList,
  LogOut
} from "lucide-react";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();
  const userInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '';

  let menuItems: { icon: any; text: string; href: string }[] = [];

  // Generate menu items based on role
  switch (user?.role) {
    case "Admin":
      menuItems = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <UserCog size={20} />, text: "Managers", href: "/admin/managers" },
        { icon: <Users size={20} />, text: "All Users", href: "/admin/users" },
        { icon: <HelpCircle size={20} />, text: "Help Requests", href: "/admin/help-requests" },
        { icon: <Settings size={20} />, text: "Settings", href: "/admin/settings" }
      ];
      break;
    case "Manager":
      menuItems = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <UserCheck size={20} />, text: "Sales Staff", href: "/manager/sales-staff" },
        { icon: <Users size={20} />, text: "Agents", href: "/manager/agents" },
        { icon: <BarChart size={20} />, text: "Reports", href: "/manager/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/manager/messages" },
        { icon: <Settings size={20} />, text: "Settings", href: "/manager/settings" }
      ];
      break;
    case "SalesStaff":
      menuItems = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <Users size={20} />, text: "Agents", href: "/sales-staff/agents" },
        { icon: <UsersRound size={20} />, text: "Agent Groups", href: "/sales-staff/agent-groups" },
        { icon: <CalendarCheck size={20} />, text: "Attendance", href: "/sales-staff/attendance" },
        { icon: <BarChart size={20} />, text: "Reports", href: "/sales-staff/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/sales-staff/messages" },
        { icon: <Settings size={20} />, text: "Settings", href: "/sales-staff/settings" }
      ];
      break;
    case "TeamLeader":
    case "Agent":
      menuItems = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <UserPlus size={20} />, text: "Clients", href: "/agent/clients" },
        { icon: <CalendarCheck size={20} />, text: "Attendance", href: "/agent/attendance" },
        { icon: <ClipboardList size={20} />, text: "Reports", href: "/agent/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/agent/messages" },
        { icon: <Settings size={20} />, text: "Settings", href: "/agent/settings" }
      ];
      break;
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Agent Management</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-4 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
            {user.role} Dashboard
          </div>
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location === item.href
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className={cn(
                  "mr-3",
                  location === item.href
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-500"
                )}>
                  {item.icon}
                </span>
                {item.text}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-500">{user.workId}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
