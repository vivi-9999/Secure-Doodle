import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useUpdatePin, useSetDuressPin } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key, ShieldAlert, CheckCircle } from "lucide-react";

export default function Settings({ user }: { user: any }) {
  const { toast } = useToast();
  const updatePinMutation = useUpdatePin();
  const setDuressPinMutation = useSetDuressPin();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [duressCurrentPin, setDuressCurrentPin] = useState("");
  const [duressPin, setDuressPin] = useState("");

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePinMutation.mutate({ data: { currentPin, newPin } }, {
      onSuccess: () => {
        toast({ title: "PIN updated successfully" });
        setCurrentPin("");
        setNewPin("");
      },
      onError: (error: any) => {
        toast({ title: "Update failed", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
      }
    });
  };

  const handleDuressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDuressPinMutation.mutate({ data: { currentPin: duressCurrentPin, duressPin } }, {
      onSuccess: () => {
        toast({ title: "Emergency PIN activated", description: "Your stealth mode is now armed." });
        setDuressCurrentPin("");
        setDuressPin("");
      },
      onError: (error: any) => {
        toast({ title: "Failed to set emergency PIN", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <UserLayout>
      <div className="max-w-lg mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Regular PIN */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Key className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Change PIN</CardTitle>
            <CardDescription>Update your secure login PIN</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input id="currentPin" type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="••••" maxLength={6} required data-testid="input-current-pin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN</Label>
                <Input id="newPin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" maxLength={6} minLength={4} required data-testid="input-new-pin" />
              </div>
              <Button type="submit" className="w-full" disabled={updatePinMutation.isPending} data-testid="btn-update-pin">
                {updatePinMutation.isPending ? "Updating..." : "Update PIN"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Duress / Emergency PIN */}
        <Card className="border-2 border-amber-200 shadow-sm bg-amber-50/30">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">Emergency PIN</CardTitle>
              {user?.hasDuressPin && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Armed
                </span>
              )}
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Set a secret <strong>Stealth Mode PIN</strong>. If you ever log in with this PIN under duress, you'll see a decoy account — while the bank's security team is silently alerted. The attacker sees nothing unusual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDuressSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duressCurrentPin">Your Main PIN (to verify identity)</Label>
                <Input id="duressCurrentPin" type="password" value={duressCurrentPin} onChange={(e) => setDuressCurrentPin(e.target.value)} placeholder="••••" maxLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duressPin">Emergency PIN (must be different)</Label>
                <Input id="duressPin" type="password" value={duressPin} onChange={(e) => setDuressPin(e.target.value)} placeholder="••••" maxLength={6} minLength={4} required />
              </div>
              <div className="p-3 bg-amber-100/60 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                <p className="font-semibold">How it works:</p>
                <p>→ Login with this PIN shows ₹500 decoy balance with no real transactions</p>
                <p>→ A CRITICAL alert fires silently in the admin's Security Monitor</p>
                <p>→ Your real account data remains completely hidden</p>
              </div>
              <Button type="submit" variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-100" disabled={setDuressPinMutation.isPending}>
                {setDuressPinMutation.isPending ? "Activating..." : user?.hasDuressPin ? "Update Emergency PIN" : "Arm Emergency PIN"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
