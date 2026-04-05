import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  hasFirstAccountData,
  type CreateOnboardingProfile,
  type FirstAccount,
  type Profile,
  type RegionalPreferences,
  type WorkspaceBasics,
} from "@workspace/types";
import { toast } from "sonner";

import { DASHBOARD_ROUTE } from "@/constants";
import { setProfileId } from "@/lib/api-client";
import { useAppStore } from "@/stores";
import { useCreateAccount } from "@/features/accounts/api/use-accounts";

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
  const createAccount = useCreateAccount();

  const [completionState, setCompletionState] = useState(
    initialCompletionState
  );
  const [formState, setFormState] = useState(createInitialFormState);
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);

  const currentStep = useMemo(() => getOnboardingStep(step), [step]);
  const previousStep = useMemo(() => getPreviousStep(step), [step]);
  const nextStep = useMemo(() => getNextStep(step), [step]);
  const lastUnlockedStep = useMemo(
    () => getLastUnlockedStep(completionState),
    [completionState]
  );
  const hasOptionalFirstAccount = hasFirstAccountData(formState.firstAccount);
  const canGoNext = nextStep !== null && completionState[step];
  const canSubmitOptionalAccount = step === 3 && hasOptionalFirstAccount;
  const isSubmitting =
    createOnboardingProfile.isPending || createAccount.isPending;

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

  const updateWorkspaceBasics = useCallback(
    function updateWorkspaceBasics(workspaceBasics: WorkspaceBasics) {
      setFormState((current) => {
        if (createdProfile) {
          return current;
        }

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
    },
    [createdProfile]
  );

  const updateRegionalPreferences = useCallback(
    function updateRegionalPreferences(
      regionalPreferences: RegionalPreferences
    ) {
      setFormState((current) => {
        if (createdProfile) {
          return current;
        }

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
    [createdProfile]
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

  const finishOnboarding = useCallback(
    async function finishOnboarding(hasAccount: boolean) {
      if (!createdProfile) {
        return;
      }

      completeOnboarding(createdProfile, hasAccount);
      toast.success(
        hasAccount
          ? "Workspace and account created successfully"
          : "Workspace created successfully"
      );
      await navigate({ to: DASHBOARD_ROUTE, replace: true });
    },
    [completeOnboarding, createdProfile, navigate]
  );

  const submitWorkspaceProfile = useCallback(
    async function submitWorkspaceProfile() {
      const payload: CreateOnboardingProfile = {
        ...formState.workspaceBasics,
        ...formState.regionalPreferences,
      };

      try {
        const profile = await createOnboardingProfile.mutateAsync(payload);
        setProfileId(profile.id);
        setCreatedProfile(profile);
        setStepCompletion(2, true);
        onStepChange(3);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create workspace"
        );
      }
    },
    [
      createOnboardingProfile,
      formState.regionalPreferences,
      formState.workspaceBasics,
      onStepChange,
      setStepCompletion,
    ]
  );

  const submitOptionalAccountStep = useCallback(
    async function submitOptionalAccountStep() {
      if (!createdProfile || !hasOptionalFirstAccount) {
        return;
      }

      try {
        await createAccount.mutateAsync({
          name: formState.firstAccount.name,
          group: formState.firstAccount.group,
          balance: formState.firstAccount.balance,
          currency: formState.regionalPreferences.currency,
          isActive: true,
          includeInNetWorth: true,
          sortOrder: 0,
        });
        await finishOnboarding(true);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create account"
        );
      }
    },
    [
      createAccount,
      createdProfile,
      finishOnboarding,
      formState.firstAccount,
      formState.regionalPreferences.currency,
      hasOptionalFirstAccount,
    ]
  );

  const skipOptionalAccountStep = useCallback(
    async function skipOptionalAccountStep() {
      await finishOnboarding(false);
    },
    [finishOnboarding]
  );

  const goToNextStep = useCallback(
    async function goToNextStep() {
      if (step === 2) {
        await submitWorkspaceProfile();
        return;
      }

      if (nextStep && canGoNext) {
        onStepChange(nextStep);
      }
    },
    [canGoNext, nextStep, onStepChange, step, submitWorkspaceProfile]
  );

  const goToPreviousStep = useCallback(
    function goToPreviousStep() {
      if (createdProfile) {
        return;
      }

      if (previousStep) {
        onStepChange(previousStep);
      }
    },
    [createdProfile, onStepChange, previousStep]
  );

  const goToStep = useCallback(
    function goToStep(nextRequestedStep: OnboardingStep) {
      if (createdProfile && nextRequestedStep < 3) {
        return;
      }

      if (canAccessStep(nextRequestedStep, completionState)) {
        onStepChange(nextRequestedStep);
      }
    },
    [completionState, createdProfile, onStepChange]
  );

  return {
    step,
    steps: onboardingSteps,
    currentStep,
    previousStep: createdProfile ? null : previousStep,
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
  };
}
