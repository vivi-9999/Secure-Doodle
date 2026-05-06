import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminGetTransactions, AdminGetTransactionsType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminTransactions() {
  const [typeFilter, setTypeFilter] = useState<AdminGetTransactionsType | "all">("all");
  
  const { data, isLoading } = useAdminGetTransactions(
    typeFilter === "all" ? { limit: 100 } : { type: typeFilter, limit: 100 }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">System Ledger</h1>
          <div className="w-48">
            <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)} data-testid="select-type-filter">
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>Global Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading ledger...</div>
            ) : data?.transactions && data.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Account details</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 
                            tx.type === 'withdrawal' ? 'bg-red-100 text-red-600' : 
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {tx.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4" /> : 
                             tx.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4" /> : 
                             <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">{tx.type}</div>
                          <div className="text-xs text-muted-foreground font-mono space-y-1 mt-1">
                            {tx.fromAccountNumber && <div>From: {tx.fromAccountNumber} ({tx.fromName})</div>}
                            {tx.toAccountNumber && <div>To: {tx.toAccountNumber} ({tx.toName})</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status === 'success' ? 'default' : 'destructive'} className={tx.status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
