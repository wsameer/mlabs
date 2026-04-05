import { CheckIcon, ChevronRightIcon } from "lucide-react";

import type { OnboardingCompletionState, OnboardingStep } from "../types";
import { onboardingSteps } from "../lib/onboarding-flow";
import { cn } from "@workspace/ui/lib/utils";

type OnboardingStepperProps = {
  currentStep: OnboardingStep;
  completionState: OnboardingCompletionState;
  canNavigateToStep: (step: OnboardingStep) => boolean;
  onStepSelect: (step: OnboardingStep) => void;
};

export function OnboardingStepper({
  currentStep,
  completionState,
  canNavigateToStep,
  onStepSelect,
}: OnboardingStepperProps) {
  return (
    <div className="space-y-3">
      {onboardingSteps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isComplete = completionState[step.id];
        const isUnlocked = canNavigateToStep(step.id);

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => isUnlocked && onStepSelect(step.id)}
            disabled={!isUnlocked}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
              isActive && "border-primary bg-primary/5",
              isComplete && "border-emerald-500/40 bg-emerald-500/5",
              !isActive && !isComplete && "border-border bg-background",
              !isUnlocked && "cursor-not-allowed opacity-50"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                isComplete
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? <CheckIcon className="size-4" /> : step.id}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>

            {index < onboardingSteps.length - 1 ? (
              <ChevronRightIcon className="mt-1 hidden size-4 text-muted-foreground md:block" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
