import { Hono } from "hono";
import {
  CheckWorkspaceNameAvailabilityQuerySchema,
  CreateOnboardingProfileSchema,
} from "@workspace/types";
import type {
  ApiResponse,
  CheckWorkspaceNameAvailabilityResult,
  CreateOnboardingProfile,
  Profile,
} from "@workspace/types";

import { validate } from "../middleware/validator.js";
import { profilesService } from "../services/profiles.service.js";

const profilesRoute = new Hono();

profilesRoute.post(
  "/",
  validate("json", CreateOnboardingProfileSchema),
  async (c) => {
    const payload = c.req.valid("json") as CreateOnboardingProfile;
    const createdProfile =
      await profilesService.createOnboardingProfile(payload);

    const response: ApiResponse<Profile> = {
      success: true,
      data: createdProfile,
    };

    return c.json(response, 201);
  }
);

profilesRoute.get(
  "/name-availability",
  validate("query", CheckWorkspaceNameAvailabilityQuerySchema),
  async (c) => {
    const { name } = c.req.valid("query");
    const available = await profilesService.isWorkspaceNameAvailable(name);

    const response: ApiResponse<CheckWorkspaceNameAvailabilityResult> = {
      success: true,
      data: {
        name,
        available,
      },
    };

    return c.json(response);
  }
);

export default profilesRoute;
