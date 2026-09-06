import { z } from "zod";

export const actionSchema = z.object({
  action: z.string().min(1, "Action ID is required"),
  title: z.string().min(1, "Action title is required"),
  icon: z.string().optional().or(z.literal("")),
});

const urlOrPathSchema = z
  .string()
  .refine(
    (val) =>
      !val ||
      val.startsWith("/") ||
      val.startsWith("http://") ||
      val.startsWith("https://") ||
      val.startsWith("data:"),
    { message: "Must be a valid URL, relative path (/...), or data URI" }
  )
  .optional()
  .or(z.literal(""));

export const notificationConfigSchema = z.object({
  name: z.string().min(1, "Notification name is required").max(100),
  title: z.string().min(1, "Title is required").max(120),
  body: z.string().min(1, "Body message is required").max(500),
  icon: urlOrPathSchema,
  badge: urlOrPathSchema,
  image: urlOrPathSchema,
  url: z.string().optional().or(z.literal("")),
  tag: z.string().max(50).optional().or(z.literal("")),
  direction: z.enum(["auto", "ltr", "rtl"]).optional().default("auto"),
  language: z.string().optional().default("en"),
  requireInteraction: z.boolean().optional().default(false),
  silent: z.boolean().optional().default(false),
  renotify: z.boolean().optional().default(false),
  timestamp: z.number().optional().nullable(),
  vibration: z.array(z.number()).optional().default([100, 50, 100]),
  actions: z.array(actionSchema).optional().default([]),
  data: z.record(z.unknown()).optional().default({}),
  style: z.record(z.unknown()).optional().default({}),
  theme: z.enum(["light", "dark"]).optional(),
});

export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>;
