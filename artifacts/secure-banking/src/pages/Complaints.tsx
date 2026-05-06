import { useState } from "react";
import { UserLayout } from "@/components/layout/UserLayout";
import { useGetMyComplaints, useCreateComplaint } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { getGetMyComplaintsQueryKey } from "@workspace/api-client-react";

export default function Complaints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: complaints, isLoading } = useGetMyComplaints();
  const createComplaint = useCreateComplaint();

  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createComplaint.mutate({ data: { description } }, {
      onSuccess: () => {
        toast({ title: "Complaint submitted" });
        setDescription("");
        queryClient.invalidateQueries({ queryKey: getGetMyComplaintsQueryKey() });
      },
      onError: (error: any) => {
        toast({ 
          title: "Submission failed", 
          description: error.data?.error || "Unknown error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Support & Complaints</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="animate-in fade-in slide-in-from-left-4 duration-500 h-fit">
            <CardHeader>
              <CardTitle>Submit a Complaint</CardTitle>
              <CardDescription>Tell us what went wrong. Maximum 250 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea 
                    id="desc" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={250}
                    placeholder="Describe your issue..."
                    rows={5}
                    required
                    data-testid="input-complaint"
                  />
                  <div className="text-xs text-right text-muted-foreground">{description.length}/250</div>
                </div>
                <Button type="submit" className="w-full" disabled={createComplaint.isPending || !description} data-testid="btn-submit-complaint">
                  {createComplaint.isPending ? "Submitting..." : "Submit Complaint"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
            <CardHeader>
              <CardTitle>My Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-4 text-center text-muted-foreground">Loading...</div>
              ) : complaints && complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((c) => (
                    <div key={c.id} className="p-4 border rounded-lg bg-card/50 space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={c.status === 'resolved' ? 'default' : 'secondary'} className={c.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                          {c.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <p className="text-sm">{c.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No complaints found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
