import { SparklesIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { onboardingSteps } from "../lib/onboarding-flow";
import type { OnboardingStep } from "../types";

type OnboardingStepCardProps = {
  step: OnboardingStep;
  isComplete: boolean;
  onComplete: (step: OnboardingStep) => void;
};

export function OnboardingStepCard({
  step,
  isComplete,
  onComplete,
}: OnboardingStepCardProps) {
  const stepConfig = onboardingSteps.find((item) => item.id === step);

  if (!stepConfig) {
    return null;
  }

  return (
    <Card className="border-none shadow-xl ring-1 ring-foreground/8">
      <CardHeader>
        <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SparklesIcon className="size-6" />
        </div>
        <CardTitle>{stepConfig.title}</CardTitle>
        <CardDescription>{stepConfig.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-dashed p-4">
          <p className="text-sm text-muted-foreground">
            This step is using a temporary interaction for now. Clicking the
            button below marks the step as complete so we can validate the flow
            before the real form is wired in.
          </p>
        </div>

        <Button
          variant={isComplete ? "secondary" : "default"}
          onClick={() => onComplete(step)}
        >
          {isComplete ? "Step completed" : stepConfig.actionLabel}
        </Button>
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Completion is currently local to this page and controlled by the route
          step plus in-memory UI state.
        </p>
      </CardFooter>
    </Card>
  );
}
