import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error handling with better error messages
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        throw new Error(data.message || data.error || `Server Error: ${res.status}`);
      }
      // Fallback to text
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (e) {
      if (e instanceof Error) {
        // Pass through the error if it's already been caught and formatted
        throw e;
      }
      // Generic fallback
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }
  }
}

// Enhanced API request with timeout and better error handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  timeout = 13000 // 15 second timeout
): Promise<Response> {
  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`API Request: ${method} ${url}`);
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    // Handle network or timeout errors with user-friendly messages
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms. The server may be experiencing issues.`);
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network Error:', error);
      throw new Error(`Connection error: Unable to reach the server at ${url}. Please check your internet connection.`);
    }
    
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Setup abort controller for timeout (10 second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        console.log(`Query request: ${queryKey[0]}`);
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          signal: controller.signal
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        const data = await res.json();
        console.log(`Query response received for: ${queryKey[0]}`);
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      // Handle network or timeout errors with user-friendly messages
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout. The server may be experiencing issues.`);
      }
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network Error:', error);
        throw new Error(`Connection error: Unable to reach the server. Please check your internet connection.`);
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2, // Retry failed queries up to 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});
