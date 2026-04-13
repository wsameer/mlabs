import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type {
  CreateOnboardingProfile,
  UpdateProfile,
} from "@workspace/types";

import { profilesService } from "../services/profiles.service.js";
import {
  apiResponseSchema,
  ErrorResponseSchema,
  IdParamSchema,
  ProfileSchema,
} from "../libs/openapi-schemas.js";

const profilesRoute = new OpenAPIHono();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CreateOnboardingProfileSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  type: z.enum(["PERSONAL", "BUSINESS", "SHARED"]).default("PERSONAL"),
  currency: z.string().length(3).default("CAD"),
  dateFormat: z.string().default("D MMM, YYYY"),
  weekStart: z.enum(["SUNDAY", "MONDAY"]).default("MONDAY"),
  timezone: z.string().min(1),
  firstAccount: z
    .object({
      name: z.string().min(1),
      group: z.enum([
        "chequing", "savings", "cash", "credit_card",
        "investment", "loan", "mortgage", "asset", "other",
      ]),
      balance: z.string().optional(),
    })
    .optional(),
});

const UpdateProfileBodySchema = z.object({
  icon: z.string().max(10).optional(),
  type: z.enum(["PERSONAL", "BUSINESS", "SHARED"]).optional(),
  currency: z.string().length(3).optional(),
  dateFormat: z.string().optional(),
  weekStart: z.enum(["SUNDAY", "MONDAY"]).optional(),
  notes: z.string().optional(),
});

const CheckNameQuerySchema = z.object({
  name: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST / — Create onboarding profile
// ---------------------------------------------------------------------------

const createProfileRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Profiles"],
  summary: "Create onboarding profile",
  description: "Creates a new profile/workspace during onboarding, optionally with a first account.",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateOnboardingProfileSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: apiResponseSchema(ProfileSchema) } },
      description: "Profile created",
    },
  },
});

profilesRoute.openapi(createProfileRoute, async (c) => {
  const payload = c.req.valid("json") as unknown as CreateOnboardingProfile;
  const createdProfile = await profilesService.createOnboardingProfile(payload);
  return c.json({ success: true as const, data: createdProfile }, 201);
});

// ---------------------------------------------------------------------------
// GET /name-availability — Check workspace name availability
// ---------------------------------------------------------------------------

const nameAvailabilityRoute = createRoute({
  method: "get",
  path: "/name-availability",
  tags: ["Profiles"],
  summary: "Check workspace name availability",
  request: { query: CheckNameQuerySchema },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({ name: z.string(), available: z.boolean() })
          ),
        },
      },
      description: "Availability result",
    },
  },
});

profilesRoute.openapi(nameAvailabilityRoute, async (c) => {
  const { name } = c.req.valid("query");
  const available = await profilesService.isWorkspaceNameAvailable(name);
  return c.json({ success: true as const, data: { name, available } });
});

// ---------------------------------------------------------------------------
// GET /:id — Get profile by ID
// ---------------------------------------------------------------------------

const getProfileRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Profiles"],
  summary: "Get profile by ID",
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(ProfileSchema) } },
      description: "Profile details",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Profile not found",
    },
  },
});

profilesRoute.openapi(getProfileRoute, async (c) => {
  const { id } = c.req.valid("param");
  const profile = await profilesService.getProfileById(id);
  return c.json({ success: true as const, data: profile });
});

// ---------------------------------------------------------------------------
// PUT /:id — Update profile
// ---------------------------------------------------------------------------

const updateProfileRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Profiles"],
  summary: "Update profile",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": { schema: UpdateProfileBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(ProfileSchema) } },
      description: "Profile updated",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Profile not found",
    },
  },
});

profilesRoute.openapi(updateProfileRoute, async (c) => {
  const { id } = c.req.valid("param");
  const payload = c.req.valid("json") as unknown as UpdateProfile;
  const updatedProfile = await profilesService.updateProfile(id, payload);
  return c.json({ success: true as const, data: updatedProfile });
});

export default profilesRoute;
