// import { QueryClient } from "@tanstack/react-query";

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 1000 * 60 * 5, // 5 minutes
//       gcTime: 1000 * 60 * 10, // 10 minutes
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       retry: (failureCount, error: any) => {
//         // Don't retry on 4xx errors (client errors)
//         if (error?.response?.status >= 400 && error?.response?.status < 500) {
//           return false;
//         }
//         return failureCount < 2;
//       },
//       refetchOnWindowFocus: false, // Disable for better UX in SPAs
//       refetchOnReconnect: true, // Refetch when connection is restored
//     },
//     mutations: {
//       retry: false,
//     },
//   },
// });
