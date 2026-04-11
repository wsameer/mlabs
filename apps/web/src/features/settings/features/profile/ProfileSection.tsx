import {
  GlobeIcon,
  NotebookTextIcon,
  ShapesIcon,
  SmilePlusIcon,
} from "lucide-react";

import { WORKSPACE_TYPES } from "@workspace/types";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@workspace/ui/components/input-group";

import { SettingsProfileSummary } from "../../components/SettingsProfileSummary";
import {
  WORKSPACE_TYPE_LABELS,
  type SettingsFormValues,
} from "../../components/settings-shared";
import type { SettingsSectionProps } from "../../types";
import { useIsMobile } from "@/hooks/use-mobile";

export function ProfileSection({
  profile,
  profileQuery,
  settings,
}: SettingsSectionProps) {
  const isMobile = useIsMobile();

  if (!settings.draft) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Show summary card only on desktop — mobile has the profile card in the list */}
      {!isMobile && (
        <SettingsProfileSummary
          profile={profile}
          isRefreshing={profileQuery.isFetching}
          isSaving={settings.isBusy}
          isNotesDebouncing={settings.isNotesDebouncing}
        />
      )}

      {profileQuery.isError ? (
        <Card className="border-amber-300/70 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-100">
            We could not refresh settings right now. You can still edit the last
            loaded values and try again.
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-1.5">
        <p className="px-4 text-xs font-normal text-muted-foreground uppercase md:px-1 md:text-[0.7rem] md:font-semibold md:tracking-[0.18em]">
          Workspace
        </p>
        <Card className="rounded-xl p-0 md:rounded-lg">
          <CardContent className="p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                <Input
                  id="workspace-name"
                  value={profile.name}
                  readOnly
                  aria-readonly="true"
                  className="bg-muted"
                />
                <FieldDescription>
                  This is visible here for reference. Editing the workspace name
                  is not available yet.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-timezone">Timezone</FieldLabel>
                <div className="relative">
                  <GlobeIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="workspace-timezone"
                    value={profile.timezone}
                    readOnly
                    aria-readonly="true"
                    className="bg-muted pl-8"
                  />
                </div>
                <FieldDescription>
                  Timezone is locked for now and cannot be changed from settings.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-1.5">
        <p className="px-4 text-xs font-normal text-muted-foreground uppercase md:px-1 md:text-[0.7rem] md:font-semibold md:tracking-[0.18em]">
          Personalization
        </p>
        <Card className="rounded-xl p-0 md:rounded-lg">
          <CardContent className="p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="workspace-icon">Workspace icon</FieldLabel>
                <div className="relative">
                  <SmilePlusIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="workspace-icon"
                    value={settings.draft.icon}
                    onChange={(event) =>
                      void settings.updateImmediateField(
                        "icon",
                        event.target.value.slice(0, 10)
                      )
                    }
                    placeholder="e.g. 💼"
                    maxLength={10}
                    className="pl-8"
                    disabled={settings.isBusy}
                  />
                </div>
                <FieldDescription>
                  Use a short emoji or symbol for quick recognition.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-type">Workspace type</FieldLabel>
                <div className="relative">
                  <ShapesIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <NativeSelect
                    id="workspace-type"
                    value={settings.draft.type}
                    onChange={(event) =>
                      void settings.updateImmediateField(
                        "type",
                        event.target.value as SettingsFormValues["type"]
                      )
                    }
                    className="w-full pl-8"
                    disabled={settings.isBusy}
                  >
                    {WORKSPACE_TYPES.map((type) => (
                      <NativeSelectOption key={type} value={type}>
                        {WORKSPACE_TYPE_LABELS[type]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="workspace-notes">Notes</FieldLabel>
                <InputGroup className="relative">
                  <NotebookTextIcon className="pointer-events-none absolute top-3 left-2.5 size-3.5 text-muted-foreground" />
                  <InputGroupTextarea
                    id="workspace-notes"
                    value={settings.draft.notes}
                    onChange={(event) =>
                      settings.updateNotesDraft(event.target.value)
                    }
                    placeholder="Anything useful to remember about this workspace"
                    className="min-h-10 pl-8"
                    maxLength={160}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText>
                      {settings.draft.notes.length}/160
                      {settings.isNotesDebouncing ? " unsaved" : ""}
                    </InputGroupText>
                    <InputGroupButton
                      variant="default"
                      size="sm"
                      className="ml-auto"
                      disabled={
                        !settings.isNotesDebouncing ||
                        settings.isNotesSaving ||
                        settings.isBusy
                      }
                      onClick={() => void settings.saveNotes()}
                    >
                      {settings.isNotesSaving ? "Saving" : "Save"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  Private notes for this workspace only.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
