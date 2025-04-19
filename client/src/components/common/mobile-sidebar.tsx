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
  LogOut,
  X
} from "lucide-react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

export default function MobileSidebar({ isOpen, onClose, user, onLogout }: MobileSidebarProps) {
  const [location] = useLocation();
  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  let menuItems: { icon: any; text: string; href: string }[] = [];

  // Generate menu items based on role
  switch (user.role) {
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

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-40">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      <div className="fixed inset-y-0 left-0 flex flex-col w-full max-w-xs bg-white transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="text-xl font-semibold text-gray-900">Agent Management</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <div className="px-4 py-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
            {user.role} Dashboard
          </div>
          <nav className="px-2 py-2 space-y-1">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClose}
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
            <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="font-medium">{userInitials}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
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
