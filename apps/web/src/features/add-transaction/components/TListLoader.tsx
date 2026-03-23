import { Skeleton } from "@workspace/ui/components/skeleton";

export const TListLoader = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-[25px] w-20 rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-[25px] w-20 rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-[25px] w-20 rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Skeleton className="h-[25px] w-20 rounded-xl" />
        <Skeleton className="h-[40px] w-full rounded-xl" />
      </div>
    </div>
  );
};
