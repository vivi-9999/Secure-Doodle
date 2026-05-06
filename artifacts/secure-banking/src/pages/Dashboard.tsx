import { UserLayout } from "@/components/layout/UserLayout";
import { useGetTransactionSummary, useGetTransactionHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, CreditCard } from "lucide-react";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { format } from "date-fns";

export default function Dashboard({ user }: { user: any }) {
  const { data: summary } = useGetTransactionSummary();
  const { data: history } = useGetTransactionHistory({ limit: 5 });
  
  const balanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (balanceRef.current && summary) {
      const balance = Number(summary.currentBalance) || 0;
      let start = 0;
      const step = balance / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= balance) { start = balance; clearInterval(timer); }
        if (balanceRef.current) {
          balanceRef.current.textContent = `₹${Math.round(start).toLocaleString('en-IN')}`;
        }
      }, 25);
    }

    animate('.dash-stagger', {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 600,
      ease: 'easeOutQuad'
    });
  }, [summary]);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight dash-stagger opacity-0">Welcome back, {user.firstName}</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* ATM Card */}
          <div className="dash-stagger opacity-0 relative group perspective-1000 w-full max-w-md">
            <div className="relative w-full h-56 rounded-2xl p-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white shadow-xl overflow-hidden transition-transform duration-500 transform-style-3d group-hover:rotate-y-12 group-hover:rotate-x-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="font-bold text-xl tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  SECUREBANK
                </div>
                <div className="text-lg opacity-80">DEBIT</div>
              </div>
              
              <div className="mt-8 mb-4">
                <div className="w-12 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm opacity-90 rounded-md"></div>
              </div>
              
              <div className="font-mono text-2xl tracking-widest shadow-sm z-10 relative">
                {user.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
              </div>
              
              <div className="flex justify-between items-end mt-4 relative z-10">
                <div className="uppercase tracking-widest text-sm opacity-90">{user.firstName} {user.lastName}</div>
                <div className="text-xs flex flex-col items-end">
                  <span className="opacity-75" style={{ fontSize: '0.6rem' }}>VALID THRU</span>
                  <span className="font-mono">12/28</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <Card className="dash-stagger opacity-0 bg-card border shadow-sm flex flex-col justify-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-mono font-bold text-primary" ref={balanceRef} data-testid="text-balance">
                ₹0
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800`}>
                  Active Status
                </span>
                Account is verified and secure.
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 dash-stagger opacity-0">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposits</p>
                <p className="font-bold text-lg">₹{summary?.totalDeposits.toLocaleString('en-IN') || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Withdrawals</p>
                <p className="font-bold text-lg">₹{summary?.totalWithdrawals.toLocaleString('en-IN') || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="font-bold text-lg">₹{summary?.totalTransfersSent.toLocaleString('en-IN') || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="font-bold text-lg">₹{summary?.totalTransfersReceived.toLocaleString('en-IN') || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="dash-stagger opacity-0">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.transactions && history.transactions.length > 0 ? (
              <div className="space-y-4">
                {history.transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'deposit' || (tx.type === 'transfer' && tx.toAccountNumber === user.accountNumber) 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : 
                         tx.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4" /> : 
                         <ArrowRightLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${
                      tx.type === 'deposit' || (tx.type === 'transfer' && tx.toAccountNumber === user.accountNumber) 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' || (tx.type === 'transfer' && tx.toAccountNumber === user.accountNumber) ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent transactions</div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
