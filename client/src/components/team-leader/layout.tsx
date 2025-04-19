import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Menu, X, Home, Users, ClipboardList, MessageSquare, Clock } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Load unread messages count
    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch('/api/messages/unread/count');
        if (response.ok) {
          const data = await response.json();
          setUnreadMessages(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unread messages:', error);
      }
    };

    fetchUnreadMessages();
    // Set up interval to check for new messages
    const interval = setInterval(fetchUnreadMessages, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/team-leader/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Team Members',
      href: '/team-leader/members',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Daily Reports',
      href: '/team-leader/reports',
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      name: 'Attendance',
      href: '/team-leader/attendance',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      name: 'Messages',
      href: '/team-leader/messages',
      icon: (
        <div className="relative">
          <MessageSquare className="h-5 w-5" />
          {unreadMessages > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </Badge>
          )}
        </div>
      ),
    },
  ];

  const navContent = (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="flex items-center mb-6">
          <Avatar className="h-10 w-10 mr-2">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-muted-foreground">{user.role} - {user.workId}</p>
          </div>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive ? 'bg-secondary hover:bg-secondary' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="px-3 py-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            logoutMutation.mutate();
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {isMobile ? (
        <>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="absolute top-4 left-4 z-50">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              {navContent}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div className="hidden md:flex w-64 flex-col border-r">
          {navContent}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center px-6 bg-white">
          <div className="w-full flex justify-between items-center">
            <h1 className="text-xl font-semibold">{title || 'Team Leader Dashboard'}</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.firstName[0]}{user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.role} - {user.workId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 pt-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}