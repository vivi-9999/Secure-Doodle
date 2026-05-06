import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CheckCircle, XCircle, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, MessageSquare } from "lucide-react";
import { animate, stagger } from "animejs";
import { useEffect, useRef } from "react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminGetStats();
  
  useEffect(() => {
    if (stats) {
      animate('.stat-card', {
        translateY: [20, 0],
        opacity: [0, 1],
        delay: stagger(100),
        duration: 600,
        ease: 'easeOutQuad'
      });
    }
  }, [stats]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">Loading stats...</div>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  const statItems = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Pending Approval", value: stats.pendingUsers, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Active Users", value: stats.activeUsers, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { title: "Rejected Applications", value: stats.rejectedUsers, icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
    
    { title: "Total Transactions", value: stats.totalTransactions, icon: ArrowRightLeft, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Total Deposits", value: `₹${stats.totalDeposits.toLocaleString('en-IN')}`, icon: ArrowDownToLine, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Total Withdrawals", value: `₹${stats.totalWithdrawals.toLocaleString('en-IN')}`, icon: ArrowUpFromLine, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Total Transfers", value: `₹${stats.totalTransfers.toLocaleString('en-IN')}`, icon: ArrowRightLeft, color: "text-violet-600", bg: "bg-violet-100" },
    
    { title: "Open Complaints", value: stats.openComplaints, icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statItems.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="stat-card opacity-0 border-2 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold font-mono tracking-tight" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
