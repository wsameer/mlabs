import { useEffect, useState } from "react";
import { Building2Icon, CheckIcon, InboxIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item";
import { cn } from "@workspace/ui/lib/utils";

import {
  canAccessStep,
  getLastUnlockedStep,
  getNextStep,
  getPreviousStep,
  onboardingSteps,
} from "../lib/onboarding-flow";
import type { OnboardingCompletionState, OnboardingStep } from "../types";

type OnboardingPageProps = {
  step: OnboardingStep;
  onStepChange: (step: OnboardingStep) => void;
};

const initialCompletionState: OnboardingCompletionState = {
  1: false,
  2: false,
  3: false,
};

export function OnboardingPage({ step, onStepChange }: OnboardingPageProps) {
  const [completionState, setCompletionState] = useState(
    initialCompletionState
  );

  const previousStep = getPreviousStep(step);
  const nextStep = getNextStep(step);
  const lastUnlockedStep = getLastUnlockedStep(completionState);
  const isCurrentStepComplete = completionState[step];
  const canGoNext = nextStep !== null && isCurrentStepComplete;
  const currentStepConfig = onboardingSteps.find((item) => item.id === step);

  useEffect(() => {
    if (!canAccessStep(step, completionState)) {
      onStepChange(lastUnlockedStep);
    }
  }, [completionState, lastUnlockedStep, onStepChange, step]);

  function markStepComplete(stepToComplete: OnboardingStep) {
    setCompletionState((current) => ({
      ...current,
      [stepToComplete]: true,
    }));
  }

  function handleNext() {
    if (nextStep && canGoNext) {
      onStepChange(nextStep);
    }
  }

  function handlePrevious() {
    if (previousStep) {
      onStepChange(previousStep);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex flex-col items-center gap-1 md:items-start">
                  <div className="flex size-8 items-center justify-center rounded-2xl md:justify-start">
                    <Building2Icon className="size-6" />
                  </div>
                  <CardTitle>Welcome to mLabs</CardTitle>
                  <CardDescription className="hidden md:block">
                    The current step lives in the URL. Completion stays local
                    until we wire in the real form.
                  </CardDescription>
                </div>

                <ItemGroup className="hidden md:flex">
                  {onboardingSteps.map((item) => {
                    const isActive = item.id === step;
                    const isComplete = completionState[item.id];
                    const isUnlocked = canAccessStep(item.id, completionState);

                    return (
                      <Item
                        key={item.id}
                        variant="muted"
                        className={cn({
                          "border-primary": isActive,
                          "opacity-50": !isUnlocked,
                        })}
                        render={
                          <button
                            type="button"
                            onClick={() => isUnlocked && onStepChange(item.id)}
                            disabled={!isUnlocked}
                          />
                        }
                      >
                        <ItemMedia variant="icon">
                          {isComplete ? (
                            <CheckIcon className="size-4" />
                          ) : (
                            <InboxIcon className="size-4" />
                          )}
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{item.title}</ItemTitle>
                          <ItemDescription>{item.description}</ItemDescription>
                        </ItemContent>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-lg font-medium">
                    {currentStepConfig?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStepConfig?.description}
                  </p>
                </div>

                <div className="rounded-md border p-4 text-center md:text-left">
                  <p className="mb-4 text-sm text-muted-foreground">
                    This is a temporary placeholder for step {step}. Use the
                    button below to mark it complete and unlock the next step.
                  </p>

                  <Button
                    variant={isCurrentStepComplete ? "secondary" : "default"}
                    onClick={() => markStepComplete(step)}
                  >
                    {isCurrentStepComplete
                      ? "Step completed"
                      : currentStepConfig?.actionLabel}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!previousStep}
                  >
                    Previous
                  </Button>

                  <Button onClick={handleNext} disabled={!canGoNext}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
