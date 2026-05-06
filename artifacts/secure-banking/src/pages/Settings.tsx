import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useUpdatePin, useSetDuressPin, useGetTrustedDevices, useAddTrustedDevice, useRemoveTrustedDevice } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key, ShieldAlert, CheckCircle, Monitor, Trash2, Loader2, Laptop } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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

export default function Settings({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updatePinMutation = useUpdatePin();
  const setDuressPinMutation = useSetDuressPin();
  const addTrustedDeviceMutation = useAddTrustedDevice();
  const removeTrustedDeviceMutation = useRemoveTrustedDevice();
  const { data: trustedDevicesData, isLoading: loadingDevices } = useGetTrustedDevices();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [duressCurrentPin, setDuressCurrentPin] = useState("");
  const [duressPin, setDuressPin] = useState("");
  const [trustPin, setTrustPin] = useState("");
  const [showTrustForm, setShowTrustForm] = useState(false);

  const deviceToken = getOrCreateDeviceToken();
  const deviceName = getDeviceName();
  const devices = trustedDevicesData?.devices ?? [];
  const isCurrentDeviceTrusted = devices.some((d: any) => d.deviceToken === deviceToken);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePinMutation.mutate({ data: { currentPin, newPin } }, {
      onSuccess: () => {
        toast({ title: "PIN updated successfully" });
        setCurrentPin(""); setNewPin("");
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
        setDuressCurrentPin(""); setDuressPin("");
      },
      onError: (error: any) => {
        toast({ title: "Failed to set emergency PIN", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
      }
    });
  };

  const handleTrustDevice = (e: React.FormEvent) => {
    e.preventDefault();
    addTrustedDeviceMutation.mutate(
      { data: { currentPin: trustPin, deviceToken, deviceName } },
      {
        onSuccess: () => {
          toast({ title: "Device trusted", description: `${deviceName} is now a trusted device.` });
          setTrustPin(""); setShowTrustForm(false);
          queryClient.invalidateQueries({ queryKey: ["/api/users/trusted-devices"] });
        },
        onError: (error: any) => {
          toast({ title: "Failed", description: error.data?.error || "Unknown error", variant: "destructive" });
        }
      }
    );
  };

  const handleRemoveDevice = (token: string, name: string) => {
    removeTrustedDeviceMutation.mutate(
      { token },
      {
        onSuccess: () => {
          toast({ title: "Device removed", description: `${name} is no longer trusted.` });
          queryClient.invalidateQueries({ queryKey: ["/api/users/trusted-devices"] });
        },
        onError: () => {
          toast({ title: "Failed to remove device", variant: "destructive" });
        }
      }
    );
  };

  return (
    <UserLayout>
      <div className="max-w-lg mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Change PIN */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              <Key className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Change PIN</CardTitle>
            <CardDescription>Update your secure login PIN</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Current PIN</Label>
                <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} placeholder="••••" maxLength={6} required data-testid="input-current-pin" />
              </div>
              <div className="space-y-2">
                <Label>New PIN</Label>
                <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="••••" maxLength={6} minLength={4} required data-testid="input-new-pin" />
              </div>
              <Button type="submit" className="w-full" disabled={updatePinMutation.isPending} data-testid="btn-update-pin">
                {updatePinMutation.isPending ? "Updating..." : "Update PIN"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card className="border-2 border-blue-100 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <Monitor className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Trusted Devices</CardTitle>
            <CardDescription className="leading-relaxed">
              Registered browsers and devices. Logins from unrecognized devices trigger a <strong>HIGH</strong> alert in the Security Monitor and show you a warning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDevices ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading devices...
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
                No trusted devices yet. Trust this browser to enable device monitoring.
              </div>
            ) : (
              <ul className="space-y-2">
                {devices.map((device: any) => (
                  <li key={device.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm ${device.deviceToken === deviceToken ? "border-blue-200 bg-blue-50/50" : "border-border bg-muted/20"}`}>
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-medium">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">Added {new Date(device.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.deviceToken === deviceToken && (
                        <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">This device</span>
                      )}
                      <button
                        onClick={() => handleRemoveDevice(device.deviceToken, device.deviceName)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Remove device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isCurrentDeviceTrusted && !showTrustForm && (
              <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setShowTrustForm(true)}>
                Trust this browser ({deviceName})
              </Button>
            )}

            {isCurrentDeviceTrusted && (
              <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                This browser is already trusted
              </div>
            )}

            {showTrustForm && (
              <form onSubmit={handleTrustDevice} className="space-y-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Enter your PIN to confirm:</p>
                <div className="flex gap-2">
                  <Input type="password" value={trustPin} onChange={(e) => setTrustPin(e.target.value)} placeholder="••••" maxLength={6} required className="flex-1" />
                  <Button type="submit" disabled={addTrustedDeviceMutation.isPending}>
                    {addTrustedDeviceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setShowTrustForm(false); setTrustPin(""); }}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Emergency PIN */}
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
            <CardDescription className="leading-relaxed">
              A secret <strong>Stealth Mode PIN</strong>. Log in with it under duress to show attackers a decoy ₹500 account — while a CRITICAL alert fires silently for the admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDuressSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Your Main PIN</Label>
                <Input type="password" value={duressCurrentPin} onChange={(e) => setDuressCurrentPin(e.target.value)} placeholder="••••" maxLength={6} required />
              </div>
              <div className="space-y-2">
                <Label>Emergency PIN (must be different)</Label>
                <Input type="password" value={duressPin} onChange={(e) => setDuressPin(e.target.value)} placeholder="••••" maxLength={6} minLength={4} required />
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
