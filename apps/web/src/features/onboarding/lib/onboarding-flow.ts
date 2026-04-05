import type { OnboardingCompletionState, OnboardingStep } from "../types";

export const onboardingSteps = [
  {
    id: 1 as const,
    title: "Workspace basics",
    description: "Name the workspace and choose the primary setup direction.",
    actionLabel: "Use workspace defaults",
  },
  {
    id: 2 as const,
    title: "Regional preferences",
    description: "Apply date, timezone, and currency defaults for the workspace.",
    actionLabel: "Apply regional defaults",
  },
  {
    id: 3 as const,
    title: "First account",
    description: "Add the first account placeholder so the setup can finish.",
    actionLabel: "Create starter account",
  },
] as const;

export const firstOnboardingStep: OnboardingStep = 1;
export const lastOnboardingStep: OnboardingStep = 3;

export function parseOnboardingStep(value: unknown): OnboardingStep {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
    return firstOnboardingStep;
  }

  return parsed as OnboardingStep;
}

export function getLastUnlockedStep(
  completionState: OnboardingCompletionState
): OnboardingStep {
  if (!completionState[1]) return 1;
  if (!completionState[2]) return 2;
  return 3;
}

export function canAccessStep(
  step: OnboardingStep,
  completionState: OnboardingCompletionState
) {
  return step <= getLastUnlockedStep(completionState);
}

export function getNextStep(step: OnboardingStep): OnboardingStep | null {
  if (step === lastOnboardingStep) return null;
  return (step + 1) as OnboardingStep;
}

export function getPreviousStep(step: OnboardingStep): OnboardingStep | null {
  if (step === firstOnboardingStep) return null;
  return (step - 1) as OnboardingStep;
}
