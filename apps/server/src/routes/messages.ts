import { Hono } from "hono";
import cron from "node-cron";
import {
  createScheduledMessage,
  deleteScheduledMessage,
  getScheduledMessageById,
  getScheduledMessages,
  updateScheduledMessage
} from "../db/queries.js";
import { type AuthContext, authMiddleware } from "../middleware/auth.js";
import { schedulerService } from "../services/scheduler.js";

export const messagesRoutes = new Hono<AuthContext>();

// All routes require authentication
messagesRoutes.use("/*", authMiddleware);

// List all scheduled messages for user
messagesRoutes.get("/", async (c) => {
  const user = c.get("user");
  const messages = await getScheduledMessages(user.id);
  return c.json({ success: true, data: messages });
});

// Get single message
messagesRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const message = await getScheduledMessageById(id, user.id);

  if (!message) {
    return c.json({ success: false, error: "Message not found" }, 404);
  }

  return c.json({ success: true, data: message });
});

// Create new scheduled message
messagesRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{
    target?: string;
    isGroup?: boolean;
    message?: string;
    cronExpression?: string;
    enabled?: boolean;
  }>();

  if (!body.target || !body.message || !body.cronExpression) {
    return c.json(
      { success: false, error: "target, message, and cronExpression are required" },
      400
    );
  }

  if (!cron.validate(body.cronExpression)) {
    return c.json({ success: false, error: "Invalid cron expression" }, 400);
  }

  const message = await createScheduledMessage(user.id, {
    target: body.target,
    isGroup: body.isGroup ?? false,
    message: body.message,
    cronExpression: body.cronExpression,
    enabled: body.enabled ?? true
  });

  // Update scheduler
  schedulerService.updateSchedule(message);

  return c.json({ success: true, data: message }, 201);
});

// Update scheduled message
messagesRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<{
    target?: string;
    isGroup?: boolean;
    message?: string;
    cronExpression?: string;
    enabled?: boolean;
  }>();

  const existing = await getScheduledMessageById(id, user.id);
  if (!existing) {
    return c.json({ success: false, error: "Message not found" }, 404);
  }

  if (body.cronExpression && !cron.validate(body.cronExpression)) {
    return c.json({ success: false, error: "Invalid cron expression" }, 400);
  }

  const updated = await updateScheduledMessage(id, user.id, body);

  if (updated) {
    schedulerService.updateSchedule(updated);
  }

  return c.json({ success: true, data: updated });
});

// Delete scheduled message
messagesRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const deleted = await deleteScheduledMessage(id, user.id);
  if (!deleted) {
    return c.json({ success: false, error: "Message not found" }, 404);
  }

  schedulerService.removeSchedule(id);

  return c.json({ success: true, data: null });
});
