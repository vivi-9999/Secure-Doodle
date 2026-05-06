import { useState, useEffect } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useTransfer, useLookupAccount } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle2 } from "lucide-react";
import { getGetMyProfileQueryKey, getGetTransactionSummaryQueryKey, getGetTransactionHistoryQueryKey } from "@workspace/api-client-react";
import useDebounce from "@/hooks/use-debounce";

// Quick debounce hook inline for simplicity since it's not exported standardly in the scaffold if it doesn't exist
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Transfer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const transferMutation = useTransfer();

  const [toAccountNumber, setToAccountNumber] = useState("");
  const debouncedAccount = useDebounceValue(toAccountNumber, 500);
  
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");

  const { data: recipient, isLoading: isLookingUp, error: lookupError } = useLookupAccount(
    debouncedAccount.length >= 8 ? debouncedAccount : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) {
      toast({ title: "Invalid recipient", variant: "destructive" });
      return;
    }
    
    transferMutation.mutate({ data: { toAccountNumber, amount: Number(amount), pin } }, {
      onSuccess: (data) => {
        toast({ title: "Transfer successful", description: `Sent ₹${data.transaction.amount} to ${recipient.fullName}.` });
        setToAccountNumber("");
        setAmount("");
        setPin("");
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTransactionSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTransactionHistoryQueryKey() });
      },
      onError: (error: any) => {
        toast({ 
          title: "Transfer failed", 
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
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Transfer Funds</CardTitle>
            <CardDescription>Send money instantly across the SecureBank network</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="account">Recipient Account Number</Label>
                <Input 
                  id="account" 
                  value={toAccountNumber} 
                  onChange={(e) => setToAccountNumber(e.target.value)} 
                  placeholder="Enter account number"
                  className="font-mono"
                  required
                  data-testid="input-account"
                />
                {isLookingUp && <p className="text-xs text-muted-foreground">Looking up account...</p>}
                {recipient && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100 mt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified: <strong>{recipient.fullName}</strong></span>
                  </div>
                )}
                {lookupError && debouncedAccount.length >= 8 && (
                  <p className="text-xs text-red-500">Account not found.</p>
                )}
              </div>
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
              <Button type="submit" className="w-full" disabled={transferMutation.isPending || !recipient} data-testid="btn-submit">
                {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
