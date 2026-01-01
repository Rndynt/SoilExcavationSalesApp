import React from "react";
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
import Receivables from "@/pages/receivables";
import Expenses from "@/pages/expenses";
import Trucks from "@/pages/trucks";
import Locations from "@/pages/locations";
import Pricing from "@/pages/pricing";
import Settings from "@/pages/settings";
import Recap from "@/pages/recap";
import SyncQueue from "@/pages/sync-queue";
import { LanguageProvider } from "@/contexts/language-context";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales-history" component={SalesHistory} />
        <Route path="/recap" component={Recap} />
        <Route path="/receivables" component={Receivables} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/trucks" component={Trucks} />
        <Route path="/locations" component={Locations} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/sync-queue" component={SyncQueue} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <React.Suspense fallback={null}>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </React.Suspense>
  );
}

export default App;
