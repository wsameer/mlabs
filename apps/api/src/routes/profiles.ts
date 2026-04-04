import { Hono } from "hono";
import { CreateOnboardingProfileSchema } from "@workspace/types";
import type {
  ApiResponse,
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
    const createdProfile = await profilesService.createOnboardingProfile(payload);

    const response: ApiResponse<Profile> = {
      success: true,
      data: createdProfile,
    };

    return c.json(response, 201);
  }
);

export default profilesRoute;
