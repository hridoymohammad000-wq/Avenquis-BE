import { Router, type Request } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requireTenantContext } from "../middlewares/tenant-context.js";
import { PetService } from "../../services/ai-pet/pet.service.js";
import type { PetContext } from "../../services/ai-pet/pet.types.js";
import { ApiError } from "../../errors/api-error.js";

export const aiPetRouter = Router();
const uiContext = z.object({ currentRoute: z.string().max(500).optional(), currentModule: z.string().max(100).optional(), entityType: z.string().max(100).optional(), entityId: z.string().uuid().optional() }).optional();
const chatSchema = z.object({ message: z.string().trim().min(1).max(4000), context: uiContext });

function contextFor(req: Request): PetContext {
  return { userId: req.user!.id, membershipId: req.membership!.id, tenantId: req.tenantId!, role: "MEMBER", workspaceType: "FIRM", permissions: req.permissions || [] };
}

aiPetRouter.get("/context", authenticate, requireTenantContext, (req, res, next) => {
  try { res.json({ success: true, data: contextFor(req) }); } catch (error) { next(error); }
});
aiPetRouter.post("/chat", authenticate, requireTenantContext, async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid Pet chat payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const context = { ...contextFor(req), ...parsed.data.context };
    res.json({ success: true, data: await PetService.chat(context, parsed.data.message) });
  } catch (error) { next(error); }
});
