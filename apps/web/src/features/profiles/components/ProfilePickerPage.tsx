import { useState } from "react";
import { CheckIcon, Layers3Icon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { DASHBOARD_ROUTE } from "@/constants";
import { setProfileId } from "@/lib/api-client";
import { useAppStore } from "@/stores";

export function ProfilePickerPage() {
  const navigate = useNavigate();
  const profiles = useAppStore((state) => state.appProfiles);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function continueWithProfile() {
    if (!selectedId) return;

    setProfileId(selectedId);
    await navigate({ to: DASHBOARD_ROUTE, replace: true });
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8">
      <Card className="w-full border-none shadow-xl ring-1 ring-foreground/8">
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers3Icon className="size-6" />
          </div>
          <CardTitle>Choose a workspace</CardTitle>
          <CardDescription>
            Multiple active workspaces were found. Pick one to continue into the
            app.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {profiles.map((profile) => {
            const isSelected = selectedId === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
                onClick={() => setSelectedId(profile.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-lg">
                    {profile.icon || "🏷️"}
                  </div>
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.type.toLowerCase()} workspace
                    </p>
                  </div>
                </div>

                <div
                  className={`flex size-6 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {isSelected ? <CheckIcon className="size-3.5" /> : null}
                </div>
              </button>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button onClick={() => void continueWithProfile()} disabled={!selectedId}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
