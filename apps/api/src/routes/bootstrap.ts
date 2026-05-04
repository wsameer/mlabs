import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { bootstrapService } from "../services/bootstrap.service.js";
import { apiResponseSchema, ProfileSchema } from "../libs/openapi-schemas.js";

const bootstrap = new OpenAPIHono();

const BootstrapSchema = z.object({
  status: z.enum(["onboarding", "pick", "ready"]),
  profile: ProfileSchema.nullable().optional(),
  profiles: z.array(ProfileSchema),
  hasAccount: z.boolean(),
});

const route = createRoute({
  method: "get",
  path: "/",
  tags: ["Bootstrap"],
  summary: "Get app bootstrap state",
  description:
    "Returns the initial app state: whether onboarding is needed, available profiles, and active profile.",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(BootstrapSchema),
        },
      },
      description: "Bootstrap status",
    },
  },
});

bootstrap.openapi(route, async (c) => {
  const data = await bootstrapService.getAppBootstrap();
  return c.json({ success: true as const, data });
});

export default bootstrap;
