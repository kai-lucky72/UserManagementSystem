import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart,
  UserPlus
} from "lucide-react";

interface MobileNavProps {
  role: string;
}

export default function MobileNav({ role }: MobileNavProps) {
  const [location] = useLocation();

  let items: { icon: any; text: string; href: string }[] = [];

  // Generate navigation items based on role
  switch (role) {
    case "Admin":
      items = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <Users size={20} />, text: "Managers", href: "/admin/managers" },
        { icon: <Users size={20} />, text: "Users", href: "/admin/users" },
        { icon: <MessageSquare size={20} />, text: "Help", href: "/admin/help-requests" }
      ];
      break;
    case "Manager":
      items = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <Users size={20} />, text: "Staff", href: "/manager/sales-staff" },
        { icon: <BarChart size={20} />, text: "Reports", href: "/manager/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/manager/messages" }
      ];
      break;
    case "SalesStaff":
      items = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <Users size={20} />, text: "Agents", href: "/sales-staff/agents" },
        { icon: <BarChart size={20} />, text: "Reports", href: "/sales-staff/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/sales-staff/messages" }
      ];
      break;
    case "TeamLeader":
    case "Agent":
      items = [
        { icon: <LayoutDashboard size={20} />, text: "Dashboard", href: "/" },
        { icon: <UserPlus size={20} />, text: "Clients", href: "/agent/clients" },
        { icon: <BarChart size={20} />, text: "Reports", href: "/agent/reports" },
        { icon: <MessageSquare size={20} />, text: "Messages", href: "/agent/messages" }
      ];
      break;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around">
        {items.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            className={cn(
              "flex flex-col items-center py-3",
              location === item.href
                ? "text-primary"
                : "text-gray-600"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.text}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
