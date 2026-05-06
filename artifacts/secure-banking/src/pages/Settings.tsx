import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useUpdatePin } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const updatePinMutation = useUpdatePin();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePinMutation.mutate({ data: { currentPin, newPin } }, {
      onSuccess: () => {
        toast({ title: "PIN updated successfully" });
        setCurrentPin("");
        setNewPin("");
      },
      onError: (error: any) => {
        toast({ 
          title: "Update failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <UserLayout>
      <div className="max-w-md mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Key className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl">Security Settings</CardTitle>
            <CardDescription>Update your secure PIN</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPin">Current PIN</Label>
                <Input 
                  id="currentPin" 
                  type="password" 
                  value={currentPin} 
                  onChange={(e) => setCurrentPin(e.target.value)} 
                  placeholder="••••"
                  maxLength={6}
                  required
                  data-testid="input-current-pin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPin">New PIN</Label>
                <Input 
                  id="newPin" 
                  type="password" 
                  value={newPin} 
                  onChange={(e) => setNewPin(e.target.value)} 
                  placeholder="••••"
                  maxLength={6}
                  minLength={4}
                  required
                  data-testid="input-new-pin"
                />
              </div>
              <Button type="submit" className="w-full" disabled={updatePinMutation.isPending} data-testid="btn-update-pin">
                {updatePinMutation.isPending ? "Updating..." : "Update PIN"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
