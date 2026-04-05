import type { ComponentType } from "react";
import type {
  FirstAccount,
  Profile,
  RegionalPreferences,
  WorkspaceBasics,
} from "@workspace/types";

export type OnboardingStep = 1 | 2 | 3;

export type OnboardingCompletionState = Record<OnboardingStep, boolean>;

export type OnboardingFormState = {
  workspaceBasics: WorkspaceBasics;
  regionalPreferences: RegionalPreferences;
  firstAccount: FirstAccount;
};

export type OnboardingStepComponentProps = {
  step: OnboardingStep;
  stepDefinition: OnboardingStepDefinition;
  formState: OnboardingFormState;
  createdProfile: Profile | null;
  isComplete: boolean;
  isSubmitting: boolean;
  canSubmitOptionalAccount: boolean;
  updateWorkspaceBasics: (value: WorkspaceBasics) => void;
  updateRegionalPreferences: (value: RegionalPreferences) => void;
  updateFirstAccount: (value: FirstAccount) => void;
  setStepCompletion: (step: OnboardingStep, isComplete: boolean) => void;
};

export type OnboardingStepDefinition = {
  id: OnboardingStep;
  title: string;
  description: string;
  actionLabel: string;
  Component: ComponentType<OnboardingStepComponentProps>;
};
