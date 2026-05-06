import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [accountNumber, setAccountNumber] = useState("");
  const [pin, setPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { accountNumber, pin } }, {
      onSuccess: () => {
        toast({ title: "Login successful" });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

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
              Don't have an account? <Link href="/register"><span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-register">Open one now</span></Link>
            </p>
            <div className="mt-4 pt-4 border-t w-full text-center">
              <Link href="/admin/login"><span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="link-admin-login">Admin Access</span></Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
