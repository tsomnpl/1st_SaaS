import { z } from "zod";
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/support-policy";

export const createTicketSchema = z.object({
  subject: z.string().min(3).max(160),
  description: z.string().min(5).max(4000),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  generationId: z.string().min(3).max(80).optional(),
  paymentId: z.string().min(3).max(80).optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(4000),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).optional(),
});

export const adminTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  queue: z.enum(["SUPPORT", "BILLING", "TECHNICAL", "ADMIN"]).optional(),
  assigneeUserId: z.string().min(3).max(80).nullable().optional(),
  body: z.string().min(1).max(4000).optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).optional(),
});

export const feedbackSchema = z.object({
  generationId: z.string().min(3).max(80),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  dismissed: z.boolean().optional(),
});

export const suggestionSchema = z.object({
  category: z.enum(["FEATURE", "DESIGN", "GENERATION", "EXPORT", "SUPPORT", "OTHER"]),
  title: z.string().min(3).max(140),
  body: z.string().min(5).max(2000),
});

export const assistantSchema = z.object({
  message: z.string().min(1).max(2000),
  transfer: z.boolean().optional(),
});
