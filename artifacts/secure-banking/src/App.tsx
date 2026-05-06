import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMyProfile } from "@workspace/api-client-react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Transfer from "./pages/Transfer";
import History from "./pages/History";
import Complaints from "./pages/Complaints";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminComplaints from "./pages/AdminComplaints";
import AdminFirewall from "./pages/AdminFirewall";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { data: user, isLoading } = useGetMyProfile();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} user={user} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/deposit">
        {() => <ProtectedRoute component={Deposit} />}
      </Route>
      <Route path="/withdraw">
        {() => <ProtectedRoute component={Withdraw} />}
      </Route>
      <Route path="/transfer">
        {() => <ProtectedRoute component={Transfer} />}
      </Route>
      <Route path="/history">
        {() => <ProtectedRoute component={History} />}
      </Route>
      <Route path="/complaints">
        {() => <ProtectedRoute component={Complaints} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute component={Analytics} />}
      </Route>

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/complaints" component={AdminComplaints} />
      <Route path="/admin/firewall" component={AdminFirewall} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
