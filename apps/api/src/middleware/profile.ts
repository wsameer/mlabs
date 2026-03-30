import { createMiddleware } from "hono/factory";

type ProfileEnv = {
  Variables: {
    profileId: string;
  };
};

export const profileMiddleware = createMiddleware<ProfileEnv>(async (c, next) => {
  const profileId = c.req.header("X-Profile-Id");
  if (!profileId) {
    return c.json(
      { success: false, error: { message: "X-Profile-Id header is required" } },
      400
    );
  }
  c.set("profileId", profileId);
  await next();
});
