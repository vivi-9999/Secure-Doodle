import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getOrCreateDeviceToken(): string {
  let token = localStorage.getItem("sb_device_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("sb_device_token", token);
  }
  return token;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android Device";
  if (/Mac/i.test(ua)) return "Mac — " + (/Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : /Firefox/i.test(ua) ? "Firefox" : "Browser");
  if (/Windows/i.test(ua)) return "Windows — " + (/Chrome/i.test(ua) ? "Chrome" : /Firefox/i.test(ua) ? "Firefox" : /Edge/i.test(ua) ? "Edge" : "Browser");
  if (/Linux/i.test(ua)) return "Linux Browser";
  return "Unknown Browser";
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [accountNumber, setAccountNumber] = useState("");
  const [pin, setPin] = useState("");
  const [deviceToken] = useState(() => getOrCreateDeviceToken());
  const [deviceName] = useState(() => getDeviceName());
  const [pendingTrust, setPendingTrust] = useState<{ show: boolean; onConfirm: () => void } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { accountNumber, pin, deviceToken, deviceName } },
      {
        onSuccess: (data: any) => {
          if (data?.knownDevice === false) {
            setPendingTrust({
              show: true,
              onConfirm: () => setLocation("/dashboard"),
            });
          } else {
            toast({ title: "Login successful" });
            setLocation("/dashboard");
          }
        },
        onError: (error: any) => {
          toast({
            title: "Login failed",
            description: error.data?.error || "Unknown error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleTrust = () => {
    setLocation("/dashboard?trustDevice=1");
  };

  const handleSkipTrust = () => {
    if (pendingTrust?.onConfirm) pendingTrust.onConfirm();
    setPendingTrust(null);
    toast({ title: "Login successful" });
  };

  if (pendingTrust?.show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden doodle-bg">
        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="border-2 border-amber-300 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4 text-amber-500">
                <ShieldCheck className="w-14 h-14" />
              </div>
              <CardTitle className="text-xl">New Device Detected</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1">
                We don't recognize <strong>{deviceName}</strong>. Since you have trusted devices registered, this login has been flagged in the security monitor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3 leading-relaxed">
                If this was you, trust this device in <strong>Settings → Trusted Devices</strong> so future logins aren't flagged.
              </div>
              <Button className="w-full" onClick={handleTrust}>
                Go to Dashboard & Trust this Device
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSkipTrust}>
                Continue without trusting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden doodle-bg">
      <div className="w-full max-w-md relative z-10">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4 text-primary">
              <Lock className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Enter your account details to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter your account number"
                  className="font-mono"
                  required
                  data-testid="input-account"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
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
              <Button type="submit" className="w-full mt-6" disabled={loginMutation.isPending} data-testid="btn-login">
                {loginMutation.isPending ? "Authenticating..." : "Sign In securely"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-register">Open one now</span>
              </Link>
            </p>
            <div className="mt-4 pt-4 border-t w-full text-center">
              <Link href="/admin/login">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="link-admin-login">Admin Access</span>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
