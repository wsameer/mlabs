import { Spinner } from "@workspace/ui/components/spinner";

export function ImportingStep() {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4">
      <Spinner className="size-8 text-primary" />
      <div className="text-center">
        <p className="font-medium">Importing transactions...</p>
        <p className="text-sm text-muted-foreground">
          Please don't close this page.
        </p>
      </div>
    </div>
  );
}
