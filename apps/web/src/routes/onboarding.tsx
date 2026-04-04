import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RequiresNoProfile } from "@/components/RouteGuards";
import { ONBOARDING_ROUTE } from "@/constants";
import { OnboardingPage } from "@/features/onboarding";

function getStepFromUrl() {
  const maybeStep = Number(
    new URLSearchParams(window.location.search).get("step") ?? "1"
  );

  if (!Number.isInteger(maybeStep) || maybeStep < 1 || maybeStep > 3) {
    return 1 as const;
  }

  return maybeStep as 1 | 2 | 3;
}

export const Route = createFileRoute(ONBOARDING_ROUTE)({
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const navigate = useNavigate();
  const step = getStepFromUrl();

  return (
    <RequiresNoProfile>
      <OnboardingPage
        step={step}
        onStepChange={(step) =>
          void navigate({
            to: ONBOARDING_ROUTE,
            search: { step },
            replace: true,
          })
        }
      />
    </RequiresNoProfile>
  );
}
