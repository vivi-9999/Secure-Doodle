import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { username, password } }, {
      onSuccess: () => {
        toast({ title: "Admin authentication successful" });
        setLocation("/admin");
      },
      onError: (error: any) => {
        toast({ 
          title: "Authentication failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden doodle-bg">
      <div className="w-full max-w-md relative z-10">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8 bg-card border-b rounded-t-xl">
            <div className="flex justify-center mb-4 text-primary">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Admin Gateway</CardTitle>
            <CardDescription>Secure systems access required</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Admin ID</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  data-testid="input-admin-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passphrase</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button type="submit" className="w-full mt-6 bg-primary" disabled={loginMutation.isPending} data-testid="btn-admin-login">
                {loginMutation.isPending ? "Authenticating..." : "Authorize Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
