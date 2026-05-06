import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminGetComplaints } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminComplaints() {
  const { data: complaints, isLoading } = useAdminGetComplaints();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">System Complaints</h1>

        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>Customer Feedback Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading complaints...</div>
            ) : complaints && complaints.length > 0 ? (
              <div className="grid gap-4">
                {complaints.map((c) => (
                  <div key={c.id} className="p-4 border rounded-lg bg-card/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-2">
                      <div>
                        <div className="font-medium text-sm">{c.userName} <span className="text-muted-foreground font-mono">({c.userAccountNumber})</span></div>
                        <div className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                      </div>
                      <Badge variant={c.status === 'resolved' ? 'default' : 'secondary'} className={c.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm mt-3 p-3 bg-muted/50 rounded border">{c.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No complaints found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
