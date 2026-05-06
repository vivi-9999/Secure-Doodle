import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAdminGetUsers, useAdminActivateUser, useAdminRejectUser, AdminGetUsersStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAdminGetUsersQueryKey, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AdminGetUsersStatus | "all">("all");
  
  const { data: users, isLoading } = useAdminGetUsers(
    statusFilter === "all" ? {} : { status: statusFilter }
  );

  const activateUser = useAdminActivateUser();
  const rejectUser = useAdminRejectUser();

  const handleActivate = (id: number) => {
    activateUser.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "User activated successfully" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Activation failed", description: error.data?.error, variant: "destructive" });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectUser.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "User rejected successfully" });
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Rejection failed", description: error.data?.error, variant: "destructive" });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)} data-testid="select-status-filter">
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle>Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading users...</div>
            ) : users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Details</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>KYC Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{user.accountNumber}</div>
                          <div className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono">PAN: {user.panCard}</div>
                          <div className="text-xs font-mono">Aadhaar: {user.aadhaar}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.status === 'active' ? 'default' : user.status === 'rejected' ? 'destructive' : 'secondary'}
                            className={user.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                      user.status === 'pending' ? 'bg-amber-100 text-amber-800' : ''}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => handleActivate(user.id)} disabled={activateUser.isPending} data-testid={`btn-activate-${user.id}`}>
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100" onClick={() => handleReject(user.id)} disabled={rejectUser.isPending} data-testid={`btn-reject-${user.id}`}>
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No users found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
