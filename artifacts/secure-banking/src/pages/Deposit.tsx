import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useDeposit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownToLine } from "lucide-react";
import { getGetMyProfileQueryKey, getGetTransactionSummaryQueryKey, getGetTransactionHistoryQueryKey } from "@workspace/api-client-react";

export default function Deposit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const depositMutation = useDeposit();

  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    depositMutation.mutate({ data: { amount: Number(amount), pin } }, {
      onSuccess: (data) => {
        toast({ title: "Deposit successful", description: `Added ₹${data.transaction.amount} to your account.` });
        setAmount("");
        setPin("");
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTransactionSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTransactionHistoryQueryKey() });
      },
      onError: (error: any) => {
        toast({ 
          title: "Deposit failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <UserLayout>
      <div className="max-w-md mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Deposit Funds</CardTitle>
            <CardDescription>Add money to your secure account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  min="1" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="0.00"
                  className="font-mono text-lg"
                  required
                  data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">Enter PIN to confirm</Label>
                <Input 
                  id="pin" 
                  type="password" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value)} 
                  placeholder="••••"
                  maxLength={6}
                  required
                  data-testid="input-pin"
                />
              </div>
              <Button type="submit" className="w-full" disabled={depositMutation.isPending} data-testid="btn-submit">
                {depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
