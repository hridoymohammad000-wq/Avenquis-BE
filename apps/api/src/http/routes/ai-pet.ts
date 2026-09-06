import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { PetService } from "../../services/ai-pet/pet.service.js";
import { PetContextService } from "../../services/ai-pet/pet-context.service.js";
import { ApiError } from "../../errors/api-error.js";

export const aiPetRouter = Router();
const uiContext = z.object({ currentRoute: z.string().max(500).optional(), currentModule: z.string().max(100).optional(), entityType: z.string().max(100).optional(), entityId: z.string().uuid().optional() }).optional();
const chatSchema = z.object({ message: z.string().trim().min(1).max(4000), context: uiContext });

aiPetRouter.get("/context", authenticate, async (req, res, next) => {
  try { res.json({ success: true, data: await PetContextService.resolve(req) }); } catch (error) { next(error); }
});
aiPetRouter.post("/chat", authenticate, async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid Pet chat payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const context = { ...(await PetContextService.resolve(req)), ...parsed.data.context };
    res.json({ success: true, data: await PetService.chat(context, parsed.data.message) });
  } catch (error) { next(error); }
});
