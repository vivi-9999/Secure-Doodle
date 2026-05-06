import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { LogOut, Home, ArrowDownToLine, ArrowUpFromLine, Send, History, MessageSquare, Settings, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/";
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/transfer", label: "Transfer", icon: Send },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/complaints", label: "Complaints", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-hidden doodle-bg">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col z-10">
        <div className="p-6 border-b flex items-center justify-between md:justify-center">
          <Link href="/dashboard" className="text-xl font-bold text-primary flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            SecureBank
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`} data-testid={`nav-${item.label.toLowerCase()}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
