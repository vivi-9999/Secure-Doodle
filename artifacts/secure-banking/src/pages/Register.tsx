import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", pin: "",
    panCard: "", aadhaar: "", address: "", city: "", state: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: formData }, {
      onSuccess: () => {
        toast({ title: "Registration submitted", description: "Your account is pending admin approval." });
        setLocation("/login");
      },
      onError: (error: any) => {
        toast({ 
          title: "Registration failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12 relative overflow-hidden doodle-bg">
      <div className="w-full max-w-2xl relative z-10">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4 text-primary">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Open a Secure Account</CardTitle>
            <CardDescription>Complete KYC to join the network</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} required data-testid="input-firstname" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} required data-testid="input-lastname" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required data-testid="input-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={handleChange} required data-testid="input-phone" />
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4 mt-2">
                <h3 className="font-medium text-sm text-muted-foreground">Identity Documents</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panCard">PAN Card</Label>
                  <Input id="panCard" value={formData.panCard} onChange={handleChange} required className="uppercase" data-testid="input-pan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar</Label>
                  <Input id="aadhaar" value={formData.aadhaar} onChange={handleChange} required data-testid="input-aadhaar" />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 mt-2">
                <h3 className="font-medium text-sm text-muted-foreground">Address Details</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={handleChange} required data-testid="input-address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={handleChange} required data-testid="input-city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={formData.state} onChange={handleChange} required data-testid="input-state" />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 mt-2">
                <h3 className="font-medium text-sm text-muted-foreground">Security</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">Create 4-6 digit PIN</Label>
                <Input id="pin" type="password" value={formData.pin} onChange={handleChange} minLength={4} maxLength={6} required data-testid="input-pin" />
              </div>

              <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending} data-testid="btn-register">
                {registerMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t p-6">
            <p className="text-sm text-muted-foreground">
              Already a member? <Link href="/login"><span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-login">Sign in</span></Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
