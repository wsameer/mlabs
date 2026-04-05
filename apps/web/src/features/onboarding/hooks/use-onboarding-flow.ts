import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateOnboardingProfile,
  FirstAccount,
  RegionalPreferences,
  WorkspaceBasics,
} from "@workspace/types";
import { hasFirstAccountData } from "@workspace/types";
import { toast } from "sonner";
import { DASHBOARD_ROUTE } from "@/constants";
import { useAppStore } from "@/stores";
import { useNavigate } from "@tanstack/react-router";

import {
  canAccessStep,
  getLastUnlockedStep,
  getNextStep,
  getOnboardingStep,
  getPreviousStep,
  onboardingSteps,
} from "../lib/onboarding-flow";
import { useCreateOnboardingProfile } from "../api/use-create-onboarding-profile";
import type {
  OnboardingCompletionState,
  OnboardingFormState,
  OnboardingStep,
} from "../types";

const initialCompletionState: OnboardingCompletionState = {
  1: false,
  2: false,
  3: false,
};

function getDetectedTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto";
}

function createInitialFormState(): OnboardingFormState {
  return {
    workspaceBasics: {
      name: "",
      type: "PERSONAL",
    },
    regionalPreferences: {
      currency: "CAD",
      dateFormat: "D MMM, YYYY",
      weekStart: "MONDAY",
      timezone: getDetectedTimezone(),
    },
    firstAccount: {
      name: "",
      group: "checking",
      balance: "",
    },
  };
}

type UseOnboardingFlowOptions = {
  step: OnboardingStep;
  onStepChange: (step: OnboardingStep) => void;
};

export function useOnboardingFlow({
  step,
  onStepChange,
}: UseOnboardingFlowOptions) {
  const navigate = useNavigate();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const createOnboardingProfile = useCreateOnboardingProfile();
  const [completionState, setCompletionState] = useState(
    initialCompletionState
  );
  const [formState, setFormState] = useState(createInitialFormState);

  const currentStep = useMemo(() => getOnboardingStep(step), [step]);
  const previousStep = useMemo(() => getPreviousStep(step), [step]);
  const nextStep = useMemo(() => getNextStep(step), [step]);
  const lastUnlockedStep = useMemo(
    () => getLastUnlockedStep(completionState),
    [completionState]
  );
  const canGoNext = nextStep !== null && completionState[step];

  useEffect(() => {
    if (!canAccessStep(step, completionState)) {
      onStepChange(lastUnlockedStep);
    }
  }, [completionState, lastUnlockedStep, onStepChange, step]);

  const setStepCompletion = useCallback(function setStepCompletion(
    stepToUpdate: OnboardingStep,
    isComplete: boolean
  ) {
    setCompletionState((current) => {
      if (current[stepToUpdate] === isComplete) {
        return current;
      }

      return {
        ...current,
        [stepToUpdate]: isComplete,
      };
    });
  }, []);

  const updateWorkspaceBasics = useCallback(function updateWorkspaceBasics(
    workspaceBasics: WorkspaceBasics
  ) {
    setFormState((current) => {
      const currentWorkspaceBasics = current.workspaceBasics;

      if (
        currentWorkspaceBasics.name === workspaceBasics.name &&
        currentWorkspaceBasics.type === workspaceBasics.type
      ) {
        return current;
      }

      return {
        ...current,
        workspaceBasics,
      };
    });
  }, []);

  const updateRegionalPreferences = useCallback(
    function updateRegionalPreferences(
      regionalPreferences: RegionalPreferences
    ) {
      setFormState((current) => {
        const currentRegionalPreferences = current.regionalPreferences;

        if (
          currentRegionalPreferences.currency ===
            regionalPreferences.currency &&
          currentRegionalPreferences.dateFormat ===
            regionalPreferences.dateFormat &&
          currentRegionalPreferences.weekStart ===
            regionalPreferences.weekStart &&
          currentRegionalPreferences.timezone === regionalPreferences.timezone
        ) {
          return current;
        }

        return {
          ...current,
          regionalPreferences,
        };
      });
    },
    []
  );

  const updateFirstAccount = useCallback(function updateFirstAccount(
    firstAccount: FirstAccount
  ) {
    setFormState((current) => {
      const currentFirstAccount = current.firstAccount;

      if (
        currentFirstAccount.name === firstAccount.name &&
        currentFirstAccount.group === firstAccount.group &&
        currentFirstAccount.balance === firstAccount.balance
      ) {
        return current;
      }

      return {
        ...current,
        firstAccount,
      };
    });
  }, []);

  const submitOnboarding = useCallback(
    async function submitOnboarding() {
      const payload: CreateOnboardingProfile = {
        ...formState.workspaceBasics,
        ...formState.regionalPreferences,
        firstAccount: hasFirstAccountData(formState.firstAccount)
          ? formState.firstAccount
          : undefined,
      };

      try {
        const profile = await createOnboardingProfile.mutateAsync(payload);
        completeOnboarding(profile);
        toast.success("Workspace created successfully");
        await navigate({ to: DASHBOARD_ROUTE, replace: true });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create workspace"
        );
        throw error;
      }
    },
    [
      createOnboardingProfile,
      completeOnboarding,
      formState.firstAccount,
      formState.regionalPreferences,
      formState.workspaceBasics,
      navigate,
    ]
  );

  const goToNextStep = useCallback(
    function goToNextStep() {
      if (nextStep && canGoNext) {
        onStepChange(nextStep);
      }
    },
    [canGoNext, nextStep, onStepChange]
  );

  const goToPreviousStep = useCallback(
    function goToPreviousStep() {
      if (previousStep) {
        onStepChange(previousStep);
      }
    },
    [onStepChange, previousStep]
  );

  const goToStep = useCallback(
    function goToStep(nextRequestedStep: OnboardingStep) {
      if (canAccessStep(nextRequestedStep, completionState)) {
        onStepChange(nextRequestedStep);
      }
    },
    [completionState, onStepChange]
  );

  return {
    step,
    steps: onboardingSteps,
    currentStep,
    previousStep,
    nextStep,
    completionState,
    formState,
    canGoNext,
    isSubmitting: createOnboardingProfile.isPending,
    setStepCompletion,
    updateWorkspaceBasics,
    updateRegionalPreferences,
    updateFirstAccount,
    submitOnboarding,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  };
}
