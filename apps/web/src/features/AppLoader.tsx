import { Skeleton } from "@workspace/ui/components/skeleton";

// TODO - make it more customized to look like the actual app
export function AppLoader() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-31.25 w-62.5 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-62.5" />
        <Skeleton className="h-4 w-50" />
      </div>
    </div>
  );
}
