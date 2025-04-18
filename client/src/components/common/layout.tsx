import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "./sidebar";
import MobileSidebar from "./mobile-sidebar";
import MobileNav from "./mobile-nav";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, navigate] = useLocation();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  const userInitials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <div>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 py-4 px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="font-medium">{userInitials}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar (hidden by default) */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Desktop Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav role={user.role} />
    </div>
  );
}
