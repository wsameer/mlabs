import type { OnboardingCompletionState, OnboardingStep } from "../types";
import type { OnboardingStepDefinition } from "../types";
import { FirstAccountStep } from "../components/steps/FirstAccountStep";
import { RegionalPreferencesStep } from "../components/steps/RegionalPreferencesStep";
import { WorkspaceBasicsStep } from "../components/steps/WorkspaceBasicsStep";

export const onboardingSteps: readonly OnboardingStepDefinition[] = [
  {
    id: 1,
    title: "Workspace basics",
    description: "Name the workspace and choose the primary setup direction.",
    actionLabel: "Next",
    Component: WorkspaceBasicsStep,
  },
  {
    id: 2,
    title: "Regional preferences",
    description:
      "Apply date, timezone, and currency defaults for the workspace.",
    actionLabel: "Create workspace",
    Component: RegionalPreferencesStep,
  },
  {
    id: 3,
    title: "First account",
    description:
      "Optionally add a starter account now, or skip and do it later.",
    actionLabel: "Create account",
    Component: FirstAccountStep,
  },
] as const;

export const firstOnboardingStep: OnboardingStep = onboardingSteps[0].id;
export const lastOnboardingStep: OnboardingStep =
  onboardingSteps[onboardingSteps.length - 1].id;

export function parseOnboardingStep(value: unknown): OnboardingStep {
  const parsed = Number(value);
  const isKnownStep = onboardingSteps.some((step) => step.id === parsed);

  if (!Number.isInteger(parsed) || !isKnownStep) {
    return firstOnboardingStep;
  }

  return parsed as OnboardingStep;
}

export function getOnboardingStep(step: OnboardingStep) {
  return onboardingSteps.find((item) => item.id === step);
}

export function getLastUnlockedStep(
  completionState: OnboardingCompletionState
): OnboardingStep {
  for (const step of onboardingSteps) {
    if (!completionState[step.id]) {
      return step.id;
    }
  }

  return lastOnboardingStep;
}

export function canAccessStep(
  step: OnboardingStep,
  completionState: OnboardingCompletionState
) {
  return step <= getLastUnlockedStep(completionState);
}

export function getNextStep(step: OnboardingStep): OnboardingStep | null {
  const currentIndex = onboardingSteps.findIndex((item) => item.id === step);
  const nextStep = onboardingSteps[currentIndex + 1];

  return nextStep?.id ?? null;
}

export function getPreviousStep(step: OnboardingStep): OnboardingStep | null {
  const currentIndex = onboardingSteps.findIndex((item) => item.id === step);
  const previousStep = onboardingSteps[currentIndex - 1];

  return previousStep?.id ?? null;
}
