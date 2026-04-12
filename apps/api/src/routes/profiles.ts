import { Hono } from "hono";
import {
  CheckWorkspaceNameAvailabilityQuerySchema,
  CreateOnboardingProfileSchema,
  ProfileParamsSchema,
  UpdateProfileSchema,
} from "@workspace/types";
import type {
  ApiResponse,
  CheckWorkspaceNameAvailabilityResult,
  CreateOnboardingProfile,
  Profile,
  UpdateProfile,
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

profilesRoute.get("/:id", validate("param", ProfileParamsSchema), async (c) => {
  const { id } = c.req.valid("param");
  const profile = await profilesService.getProfileById(id);

  const response: ApiResponse<Profile> = {
    success: true,
    data: profile,
  };

  return c.json(response);
});

profilesRoute.put(
  "/:id",
  validate("param", ProfileParamsSchema),
  validate("json", UpdateProfileSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json") as UpdateProfile;
    const updatedProfile = await profilesService.updateProfile(id, payload);

    const response: ApiResponse<Profile> = {
      success: true,
      data: updatedProfile,
    };

    return c.json(response);
  }
);

export default profilesRoute;
