import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { RequiresNoProfile } from "@/components/RouteGuards";
import { ONBOARDING_ROUTE } from "@/constants";
import { OnboardingPage, type OnboardingStep } from "@/features/onboarding";
import { parseOnboardingStep } from "@/features/onboarding/lib/onboarding-flow";

export const Route = createFileRoute(ONBOARDING_ROUTE)({
  validateSearch: (search) => ({
    step: parseOnboardingStep(search.step),
  }),
  component: OnboardingRoute,
});

function OnboardingRoute() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const step = "step" in search ? search.step : parseOnboardingStep(undefined);

  return (
    <RequiresNoProfile>
      <OnboardingPage
        step={step}
        onStepChange={(step) =>
          void navigate({
            to: ONBOARDING_ROUTE,
            search: { step: step as OnboardingStep },
            replace: true,
          })
        }
      />
    </RequiresNoProfile>
  );
}
