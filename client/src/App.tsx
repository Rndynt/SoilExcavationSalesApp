import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import SalesHistory from "@/pages/sales-history";
import Expenses from "@/pages/expenses";
import Trucks from "@/pages/trucks";
import Locations from "@/pages/locations";
import Pricing from "@/pages/pricing";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales-history" component={SalesHistory} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/trucks" component={Trucks} />
        <Route path="/locations" component={Locations} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
