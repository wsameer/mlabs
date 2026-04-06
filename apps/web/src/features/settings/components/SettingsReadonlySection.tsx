import { GlobeIcon } from "lucide-react";

import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import type { Profile } from "@workspace/types";

type SettingsReadonlySectionProps = {
  profile: Profile;
};

export function SettingsReadonlySection({
  profile,
}: SettingsReadonlySectionProps) {
  return (
    <section className="space-y-2">
      <p className="px-1 text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        Workspace
      </p>
      <Card className="p-0">
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
  );
}
