import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import type { Profile, UpdateProfile } from "@workspace/types";
import { useUpdateProfileSettings } from "../api/use-profile-settings";
import {
  profileToFormValues,
  type SettingsFormValues,
} from "../components/settings-shared";

type ImmediateField = Exclude<keyof SettingsFormValues, "notes">;

type ScopedDraft = {
  profileId: string;
  values: Partial<SettingsFormValues>;
};

export function useProfileSettingsAutosave(profile: Profile | null) {
  const updateProfile = useUpdateProfileSettings(profile?.id ?? "");
  const [localDraft, setLocalDraft] = useState<ScopedDraft | null>(null);
  const [savingField, setSavingField] = useState<
    keyof SettingsFormValues | null
  >(null);

  const serverValues = useMemo(
    () => (profile ? profileToFormValues(profile) : null),
    [profile]
  );

  const scopedLocalValues =
    profile && localDraft?.profileId === profile.id ? localDraft.values : null;

  const draft = useMemo(() => {
    if (!serverValues) {
      return null;
    }

    return {
      ...serverValues,
      ...scopedLocalValues,
    };
  }, [scopedLocalValues, serverValues]);

  const isNotesDebouncing =
    scopedLocalValues?.notes !== undefined &&
    scopedLocalValues.notes !== serverValues?.notes;

  const isNotesSaving = savingField === "notes";

  const patchLocalDraft = useCallback(
    (patch: Partial<SettingsFormValues>) => {
      if (!profile) {
        return;
      }

      setLocalDraft((currentDraft) => {
        const currentValues =
          currentDraft?.profileId === profile.id ? currentDraft.values : {};

        return {
          profileId: profile.id,
          values: {
            ...currentValues,
            ...patch,
          },
        };
      });
    },
    [profile]
  );

  const clearLocalField = useCallback(
    (field: keyof SettingsFormValues) => {
      if (!profile) {
        return;
      }

      setLocalDraft((currentDraft) => {
        if (!currentDraft || currentDraft.profileId !== profile.id) {
          return currentDraft;
        }

        const nextValues = { ...currentDraft.values };
        delete nextValues[field];

        if (Object.keys(nextValues).length === 0) {
          return null;
        }

        return {
          profileId: profile.id,
          values: nextValues,
        };
      });
    },
    [profile]
  );

  const persist = useCallback(
    async (patch: UpdateProfile, field: keyof SettingsFormValues) => {
      if (!profile) {
        return false;
      }

      setSavingField(field);

      try {
        await updateProfile.mutateAsync(patch);
        clearLocalField(field);
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save settings"
        );
        return false;
      } finally {
        setSavingField((currentField) =>
          currentField === field ? null : currentField
        );
      }
    },
    [clearLocalField, profile, updateProfile]
  );

  const updateImmediateField = useCallback(
    async <K extends ImmediateField>(
      field: K,
      value: SettingsFormValues[K]
    ) => {
      if (!profile || !draft || savingField) {
        return;
      }

      const previousValue = draft[field];

      patchLocalDraft({ [field]: value } as Partial<SettingsFormValues>);

      const didSave = await persist({ [field]: value } as UpdateProfile, field);

      if (!didSave) {
        patchLocalDraft({
          [field]: previousValue,
        } as Partial<SettingsFormValues>);
        clearLocalField(field);
      }
    },
    [clearLocalField, draft, patchLocalDraft, persist, profile, savingField]
  );

  const updateNotesDraft = useCallback(
    (value: string) => {
      patchLocalDraft({
        notes: value.slice(0, 160),
      });
    },
    [patchLocalDraft]
  );

  const saveNotes = useCallback(async () => {
    if (!profile || !draft || !isNotesDebouncing || savingField) {
      return;
    }

    const previousValue = serverValues?.notes ?? "";
    const didSave = await persist({ notes: draft.notes }, "notes");

    if (!didSave) {
      patchLocalDraft({ notes: previousValue });
      clearLocalField("notes");
    }
  }, [
    clearLocalField,
    draft,
    isNotesDebouncing,
    patchLocalDraft,
    persist,
    profile,
    savingField,
    serverValues?.notes,
  ]);

  return {
    draft,
    savingField,
    isBusy: savingField !== null,
    isNotesDebouncing,
    isNotesSaving,
    updateImmediateField,
    updateNotesDraft,
    saveNotes,
  };
}
