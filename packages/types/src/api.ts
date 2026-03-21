import z from "zod";

export const HealthCheckSchema = z.object({
  status: z.enum(["ok", "error"]),
  timestamp: z.string(),
  version: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        message: z.string(),
        code: z.string().optional(),
      })
      .optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
};
