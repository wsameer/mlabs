import { Button } from "@workspace/ui/components/button";

interface SubmitRowProps {
  isPending: boolean;
  testId?: string;
}

export function SubmitRow({ isPending, testId }: SubmitRowProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="submit"
        disabled={isPending}
        className="w-full"
        data-testid={testId}
      >
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
