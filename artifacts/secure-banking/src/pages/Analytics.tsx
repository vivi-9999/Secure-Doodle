import { useMemo } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useGetTransactionHistory, useGetMyProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, startOfDay, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, TrendingDown, ArrowRightLeft, IndianRupee, BarChart2 } from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

function fmtRupee(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color === "text-green-600" ? "bg-green-100 text-green-600" : color === "text-red-600" ? "bg-red-100 text-red-600" : color === "text-blue-600" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {fmtRupee(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { data: profile } = useGetMyProfile();
  const { data: historyData, isLoading } = useGetTransactionHistory({ limit: 500 });

  const txs = useMemo(() => historyData?.transactions ?? [], [historyData]);

  const accountNumber = profile?.accountNumber;

  // Monthly income vs expenses — last 6 months
  const monthlyData = useMemo(() => {
    const months: { month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      let income = 0, expenses = 0;
      for (const tx of txs) {
        if (tx.status !== "success") continue;
        const dt = parseISO(tx.createdAt);
        if (dt < start || dt > end) continue;
        const amt = tx.amount;
        if (tx.type === "deposit") income += amt;
        else if (tx.type === "withdrawal") expenses += amt;
        else if (tx.type === "transfer") {
          const isCredit = tx.toAccountNumber === accountNumber;
          if (isCredit) income += amt; else expenses += amt;
        }
      }
      months.push({ month: format(d, "MMM yy"), income, expenses });
    }
    return months;
  }, [txs, accountNumber]);

  // Category breakdown
  const categoryData = useMemo(() => {
    let deposits = 0, withdrawals = 0, sent = 0, received = 0;
    for (const tx of txs) {
      if (tx.status !== "success") continue;
      const amt = tx.amount;
      if (tx.type === "deposit") deposits += amt;
      else if (tx.type === "withdrawal") withdrawals += amt;
      else if (tx.type === "transfer") {
        if (tx.toAccountNumber === accountNumber) received += amt;
        else sent += amt;
      }
    }
    return [
      { name: "Deposits", value: deposits },
      { name: "Withdrawals", value: withdrawals },
      { name: "Transfers Sent", value: sent },
      { name: "Transfers Received", value: received },
    ].filter(d => d.value > 0);
  }, [txs, accountNumber]);

  // Daily balance trend — last 30 days
  const dailyTrend = useMemo(() => {
    if (!profile) return [];
    // Start from current balance, walk backwards through sorted txs
    const days: { date: string; balance: number }[] = [];
    let balance = profile.balance;
    const sortedDesc = [...txs]
      .filter(tx => tx.status === "success")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const today = startOfDay(new Date());
    const points: Record<string, number> = {};
    points[format(today, "MMM dd")] = balance;

    let txIdx = 0;
    for (let i = 0; i < 30; i++) {
      const day = startOfDay(subDays(today, i));
      const nextDay = startOfDay(subDays(today, i - 1));
      // apply txs that happened during (day, nextDay]
      while (txIdx < sortedDesc.length) {
        const txDate = parseISO(sortedDesc[txIdx].createdAt);
        if (txDate >= day && txDate < nextDay) {
          const tx = sortedDesc[txIdx];
          const amt = tx.amount;
          if (tx.type === "deposit") balance -= amt;
          else if (tx.type === "withdrawal") balance += amt;
          else if (tx.type === "transfer") {
            if (tx.toAccountNumber === accountNumber) balance -= amt;
            else balance += amt;
          }
          txIdx++;
        } else if (txDate < day) {
          break;
        } else {
          txIdx++;
        }
      }
      points[format(day, "MMM dd")] = Math.max(0, balance);
    }

    for (let i = 29; i >= 0; i--) {
      const day = format(startOfDay(subDays(today, i)), "MMM dd");
      days.push({ date: day, balance: points[day] ?? 0 });
    }
    return days;
  }, [txs, profile, accountNumber]);

  // Summary stats
  const stats = useMemo(() => {
    let totalIn = 0, totalOut = 0;
    for (const tx of txs) {
      if (tx.status !== "success") continue;
      const amt = tx.amount;
      if (tx.type === "deposit") totalIn += amt;
      else if (tx.type === "withdrawal") totalOut += amt;
      else if (tx.type === "transfer") {
        if (tx.toAccountNumber === accountNumber) totalIn += amt;
        else totalOut += amt;
      }
    }
    return { totalIn, totalOut, net: totalIn - totalOut, count: txs.filter(t => t.status === "success").length };
  }, [txs, accountNumber]);

  if (isLoading || !profile) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading analytics...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Spending Analytics</h1>
            <p className="text-muted-foreground mt-1">Visualise your financial activity</p>
          </div>
          <Badge variant="outline" className="text-xs">{stats.count} transactions</Badge>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Money In" value={fmtRupee(stats.totalIn)} sub="deposits + received" icon={TrendingUp} color="text-green-600" />
          <StatCard label="Total Money Out" value={fmtRupee(stats.totalOut)} sub="withdrawals + sent" icon={TrendingDown} color="text-red-600" />
          <StatCard label="Net Flow" value={fmtRupee(stats.net)} sub={stats.net >= 0 ? "positive" : "negative"} icon={ArrowRightLeft} color={stats.net >= 0 ? "text-blue-600" : "text-red-600"} />
          <StatCard label="Current Balance" value={fmtRupee(profile.balance)} sub="live balance" icon={IndianRupee} color="text-amber-600" />
        </div>

        {/* Balance trend + Monthly overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />30-Day Balance Trend</CardTitle>
              <CardDescription>Running balance reconstructed from transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" fill="url(#balGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4 text-green-600" />Monthly Overview</CardTitle>
              <CardDescription>Income vs expenses over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={48} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Category Breakdown</CardTitle>
            <CardDescription>Total volume by category across all time</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={240} className="max-w-xs">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={48} paddingAngle={3}>
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmtRupee(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {categoryData.map((d, idx) => {
                    const total = categoryData.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{fmtRupee(d.value)}</p>
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No transaction data yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Net flow per month line */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Net Flow</CardTitle>
            <CardDescription>Money in minus money out per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData.map(m => ({ ...m, net: m.income - m.expenses }))} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="net" name="Net" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
