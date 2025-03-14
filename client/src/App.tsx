import React, { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// Create a context for user-related data
export const UserContext = React.createContext<{
  userId: number | null;
  setUserId: React.Dispatch<React.SetStateAction<number | null>>;
}>({
  userId: null,
  setUserId: () => {},
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // For demo purposes, we'll use a hardcoded user ID
  // In a real app, this would come from authentication
  const [userId, setUserId] = useState<number | null>(1);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ userId, setUserId }}>
        <Router />
        <Toaster />
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
