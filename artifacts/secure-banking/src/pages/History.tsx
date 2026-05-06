import { useState, useEffect, useCallback } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useGetTransactionHistory, useGetMyProfile, useCancelLockedTransfer } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Timer, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function useCountdown(expiresAt: string | null | undefined) {
  const [remaining, setRemaining] = useState<string>("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setRemaining("Executing..."); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { remaining, expired };
}

function LockedRow({ tx, user, onCancel }: { tx: any; user: any; onCancel: (id: number) => void }) {
  const { remaining, expired } = useCountdown(tx.lockExpiresAt);
  return (
    <TableRow className="bg-amber-50/60 border-l-4 border-l-amber-400">
      <TableCell>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 text-amber-600">
          <Timer className="w-4 h-4" />
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">Transfer (Time-Locked)</div>
        <div className="text-xs text-muted-foreground font-mono">To: {tx.toName}</div>
      </TableCell>
      <TableCell>{format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-300 w-fit">
            ⏳ Pending
          </Badge>
          {!expired && (
            <span className="text-xs font-mono text-amber-700 font-bold">{remaining} left</span>
          )}
          {expired && (
            <span className="text-xs text-muted-foreground">Executing...</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono font-bold text-red-600">-₹{tx.amount.toLocaleString("en-IN")}</span>
          {!expired && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => onCancel(tx.id)}
            >
              <X className="w-3 h-3 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function History() {
  const { data: history, isLoading, refetch } = useGetTransactionHistory({ limit: 100 });
  const { data: user } = useGetMyProfile();
  const cancelMutation = useCancelLockedTransfer();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCancel = useCallback((id: number) => {
    cancelMutation.mutate({ id }, {
      onSuccess: (data: any) => {
        toast({ title: "Transfer cancelled", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions/history"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      },
      onError: (err: any) => {
        toast({ title: "Cannot cancel", description: err.data?.error || "Lock period may have expired", variant: "destructive" });
      }
    });
  }, [cancelMutation, toast, queryClient]);

  const lockedTxs = history?.transactions?.filter((tx: any) => tx.status === "pending_locked") ?? [];
  const regularTxs = history?.transactions?.filter((tx: any) => tx.status !== "pending_locked") ?? [];

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>

        {lockedTxs.length > 0 && (
          <Card className="border-amber-300 border-2 bg-amber-50/30 animate-in fade-in duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <Timer className="w-5 h-5" />
                {lockedTxs.length} Time-Locked Transfer{lockedTxs.length > 1 ? "s" : ""} Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Initiated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockedTxs.map((tx: any) => (
                    <LockedRow key={tx.id} tx={tx} user={user} onCancel={handleCancel} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading history...</div>
            ) : regularTxs.length > 0 ? (
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
                  {regularTxs.map((tx: any) => {
                    const isCredit = tx.type === "deposit" || (tx.type === "transfer" && tx.toAccountNumber === user?.accountNumber);
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {tx.type === "deposit" ? <ArrowDownToLine className="w-4 h-4" /> : tx.type === "withdrawal" ? <ArrowUpFromLine className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">{tx.type}</div>
                          {tx.type === "transfer" && (
                            <div className="text-xs text-muted-foreground font-mono">
                              {isCredit ? `From: ${tx.fromName}` : `To: ${tx.toName}`}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === "success" ? "default" : "destructive"} className={tx.status === "success" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono font-bold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                          {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">No transactions found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
