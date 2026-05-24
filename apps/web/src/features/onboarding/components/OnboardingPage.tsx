import { CheckIcon, FlaskConicalIcon, InboxIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
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
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";

import { canAccessStep } from "../lib/onboarding-flow";
import { useOnboardingFlow } from "../hooks/use-onboarding-flow";
import type { OnboardingStep } from "../types";

type OnboardingPageProps = {
  step: OnboardingStep;
  onStepChange: (step: OnboardingStep) => void;
};

export function OnboardingPage({ step, onStepChange }: OnboardingPageProps) {
  const {
    steps,
    currentStep,
    previousStep,
    nextStep,
    completionState,
    formState,
    createdProfile,
    canGoNext,
    canSubmitOptionalAccount,
    isSubmitting,
    setStepCompletion,
    updateWorkspaceBasics,
    updateRegionalPreferences,
    updateFirstAccount,
    submitOptionalAccountStep,
    skipOptionalAccountStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  } = useOnboardingFlow({
    step,
    onStepChange,
  });

  if (!currentStep) {
    return null;
  }

  const CurrentStepComponent = currentStep.Component;
  const isCurrentStepComplete = completionState[step];
  const progressValue = (step / steps.length) * 100;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <Card className="w-full max-w-sm md:max-w-4xl">
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex flex-col items-center gap-1 md:items-start">
                <div className="mb-2 flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <FlaskConicalIcon className="size-4" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl md:text-lg">
                  Welcome to mLabs
                </CardTitle>
                <CardDescription className="hidden md:block">
                  Each step is driven from a shared config, so we can add or
                  reorder onboarding screens without reworking the page shell.
                </CardDescription>
              </div>

              <Separator className="m-0 block md:hidden" />

              <ItemGroup className="hidden md:flex">
                {steps.map((item) => {
                  const isActive = item.id === step;
                  const isComplete = completionState[item.id];
                  const isUnlocked =
                    canAccessStep(item.id, completionState) &&
                    !(createdProfile && item.id < 3);

                  return (
                    <Item
                      key={item.id}
                      variant="muted"
                      className={cn({
                        "border-2 border-primary": isActive,
                        "opacity-50": !isUnlocked,
                      })}
                      render={
                        <button
                          type="button"
                          onClick={() => isUnlocked && goToStep(item.id)}
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

            <Card className="flex flex-col md:col-span-2">
              <CardHeader>
                <div className="md:hidden">
                  <Progress value={progressValue} className="w-full max-w-sm">
                    <ProgressLabel>
                      Step {step} of {steps.length}
                    </ProgressLabel>
                    <ProgressValue />
                  </Progress>
                </div>

                <CardTitle>{currentStep.title}</CardTitle>
                <CardDescription> {currentStep.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <CurrentStepComponent
                  step={step}
                  stepDefinition={currentStep}
                  formState={formState}
                  createdProfile={createdProfile}
                  isComplete={isCurrentStepComplete}
                  isSubmitting={isSubmitting}
                  canSubmitOptionalAccount={canSubmitOptionalAccount}
                  updateWorkspaceBasics={updateWorkspaceBasics}
                  updateRegionalPreferences={updateRegionalPreferences}
                  updateFirstAccount={updateFirstAccount}
                  setStepCompletion={setStepCompletion}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={!previousStep || isSubmitting}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {step === 3 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void skipOptionalAccountStep()}
                      disabled={isSubmitting}
                    >
                      Skip for now
                    </Button>
                  ) : null}

                  <Button
                    onClick={() =>
                      nextStep
                        ? void goToNextStep()
                        : void submitOptionalAccountStep()
                    }
                    disabled={
                      nextStep
                        ? !canGoNext || isSubmitting
                        : !canSubmitOptionalAccount || isSubmitting
                    }
                  >
                    {isSubmitting ? "Creating..." : currentStep.actionLabel}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
