import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminGetFirewallEvents, AdminGetFirewallEventsSeverity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Shield, AlertTriangle, ShieldAlert, ShieldCheck, Info, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Activity } from "lucide-react";
import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

const SEVERITY_CONFIG = {
  critical: { label: "CRITICAL", color: "bg-red-600 text-white", border: "border-red-500", dot: "bg-red-500", icon: ShieldAlert, row: "bg-red-50 border-red-200" },
  high:     { label: "HIGH",     color: "bg-orange-500 text-white", border: "border-orange-400", dot: "bg-orange-400", icon: AlertTriangle, row: "bg-orange-50 border-orange-200" },
  medium:   { label: "MEDIUM",   color: "bg-amber-400 text-black", border: "border-amber-400", dot: "bg-amber-400", icon: Shield, row: "bg-amber-50 border-amber-200" },
  low:      { label: "LOW",      color: "bg-blue-500 text-white", border: "border-blue-400", dot: "bg-blue-400", icon: Shield, row: "bg-blue-50 border-blue-200" },
  info:     { label: "INFO",     color: "bg-gray-400 text-white", border: "border-gray-300", dot: "bg-gray-400", icon: Info, row: "bg-gray-50 border-gray-200" },
};

const TYPE_ICON = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  transfer: ArrowRightLeft,
};

export default function AdminFirewall() {
  const [severity, setSeverity] = useState<AdminGetFirewallEventsSeverity | "all">("all");
  const didAnimate = useRef(false);

  const { data, isLoading, refetch } = useAdminGetFirewallEvents(
    severity === "all" ? { limit: 100 } : { severity, limit: 100 },
    { query: { refetchInterval: 15000 } as any }
  );

  useEffect(() => {
    if (data && !didAnimate.current) {
      didAnimate.current = true;
      animate(".siem-stat", { translateY: [20, 0], opacity: [0, 1], delay: stagger(80), duration: 500, ease: "easeOutQuad" });
    }
  }, [data]);

  useEffect(() => {
    if (data?.events) {
      animate(".siem-row", { opacity: [0, 1], translateX: [-8, 0], delay: stagger(20), duration: 300, ease: "easeOutQuad" });
    }
  }, [data?.events]);

  const stats = data?.stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Firewall</h1>
              <p className="text-sm text-muted-foreground font-mono">SIEM — Security Information & Event Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-mono bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              LIVE · auto-refresh 15s
            </div>
            <Select value={severity} onValueChange={(v: any) => { setSeverity(v); didAnimate.current = false; }}>
              <SelectTrigger className="w-40 font-mono text-sm">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">CRITICAL</SelectItem>
                <SelectItem value="high">HIGH</SelectItem>
                <SelectItem value="medium">MEDIUM</SelectItem>
                <SelectItem value="low">LOW</SelectItem>
                <SelectItem value="info">INFO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "TOTAL EVENTS", value: stats.total, cls: "text-foreground", bg: "bg-card", icon: Activity },
              { label: "CRITICAL", value: stats.critical, cls: "text-red-600", bg: "bg-red-50 border-red-200", icon: ShieldAlert },
              { label: "HIGH", value: stats.high, cls: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
              { label: "MEDIUM", value: stats.medium, cls: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Shield },
              { label: "LOW", value: stats.low, cls: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: Shield },
              { label: "INFO", value: stats.info, cls: "text-gray-500", bg: "bg-gray-50 border-gray-200", icon: Info },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`siem-stat opacity-0 border rounded-lg p-4 flex flex-col gap-1 ${s.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.cls}`} />
                    <span className="text-xs font-mono font-semibold text-muted-foreground">{s.label}</span>
                  </div>
                  <span className={`text-3xl font-mono font-bold ${s.cls}`}>{s.value}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Event log */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="font-mono text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              EVENT LOG
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground font-mono text-sm">Loading events...</div>
            ) : data?.events && data.events.length > 0 ? (
              <div className="divide-y">
                {data.events.map((evt) => {
                  const cfg = SEVERITY_CONFIG[evt.severity];
                  const TxIcon = TYPE_ICON[evt.type];
                  const SevIcon = cfg.icon;
                  return (
                    <div key={evt.id} className={`siem-row opacity-0 flex flex-col sm:flex-row sm:items-start gap-3 p-4 hover:bg-muted/30 transition-colors border-l-4 ${cfg.border}`}>
                      {/* Severity + EventID */}
                      <div className="flex items-center gap-3 sm:w-44 shrink-0">
                        <SevIcon className={`w-4 h-4 shrink-0 ${cfg.dot.replace("bg-", "text-")}`} />
                        <div>
                          <Badge className={`text-xs font-mono px-2 py-0.5 ${cfg.color}`}>{cfg.label}</Badge>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{evt.eventId}</div>
                        </div>
                      </div>

                      {/* Type + Amount */}
                      <div className="flex items-center gap-2 sm:w-44 shrink-0">
                        <div className={`p-1.5 rounded-full ${evt.type === "deposit" ? "bg-green-100 text-green-600" : evt.type === "withdrawal" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                          <TxIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-sm font-mono font-bold">₹{evt.amount.toLocaleString("en-IN")}</div>
                          <div className="text-xs capitalize text-muted-foreground">{evt.type}</div>
                        </div>
                      </div>

                      {/* Accounts */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground font-mono truncate">
                          {evt.fromAccount && <span>From: <span className="text-foreground">{evt.fromAccount}</span>{evt.fromName && <span className="text-muted-foreground"> ({evt.fromName})</span>}</span>}
                          {evt.fromAccount && evt.toAccount && <span className="mx-2">→</span>}
                          {evt.toAccount && <span>To: <span className="text-foreground">{evt.toAccount}</span>{evt.toName && <span className="text-muted-foreground"> ({evt.toName})</span>}</span>}
                          {!evt.fromAccount && !evt.toAccount && <span className="text-muted-foreground italic">accounts encrypted</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {evt.riskFlags.map((flag) => (
                            <span key={flag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">{flag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Timestamp + Risk score */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-muted-foreground">{format(new Date(evt.timestamp), "dd MMM HH:mm:ss")}</div>
                        <div className={`text-sm font-mono font-bold mt-0.5 ${evt.riskScore >= 70 ? "text-red-600" : evt.riskScore >= 45 ? "text-orange-600" : evt.riskScore >= 25 ? "text-amber-600" : evt.riskScore >= 10 ? "text-blue-600" : "text-gray-400"}`}>
                          RISK {evt.riskScore}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-mono text-sm text-muted-foreground">No events match the current filter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
