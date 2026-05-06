import { Link, useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { LogOut, Home, Users, ArrowRightLeft, MessageSquare, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
    { href: "/admin", label: "Overview", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/transactions", label: "Transactions", icon: ArrowRightLeft },
    { href: "/admin/complaints", label: "Complaints", icon: MessageSquare },
    { href: "/admin/firewall", label: "Firewall", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative overflow-hidden doodle-bg">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col z-10">
        <div className="p-6 border-b flex items-center justify-between md:justify-center bg-primary text-primary-foreground">
          <Link href="/admin" className="text-xl font-bold flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`} data-testid={`nav-admin-${item.label.toLowerCase()}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout} data-testid="button-admin-logout">
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
