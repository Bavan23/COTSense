import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import SearchResults from "@/pages/search-results";
import ComponentDetails from "@/pages/component-details";
import Admin from "@/pages/admin";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { ApiTest } from "@/components/ApiTest";
import { ApiDebugger } from "@/components/ApiDebugger";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchResults} />
      <Route path="/component/:id" component={ComponentDetails} />
      <Route path="/admin" component={Admin} />
      <Route path="/about" component={About} />
      <Route path="/api-test" component={ApiTest} />
      <Route path="/debug" component={ApiDebugger} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
