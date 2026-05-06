import { UserLayout } from "@/components/layout/UserLayout";
import { useGetTransactionHistory, useGetMyProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const { data: history, isLoading } = useGetTransactionHistory({ limit: 100 });
  const { data: user } = useGetMyProfile();

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
        </div>

        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading history...</div>
            ) : history?.transactions && history.transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.transactions.map((tx) => {
                    const isCredit = tx.type === 'deposit' || (tx.type === 'transfer' && tx.toAccountNumber === user?.accountNumber);
                    
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : 
                             tx.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4" /> : 
                             <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">{tx.type}</div>
                          {tx.type === 'transfer' && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {isCredit ? `From: ${tx.fromName}` : `To: ${tx.toName}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'success' ? 'default' : 'destructive'} className={tx.status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
