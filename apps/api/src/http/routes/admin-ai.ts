import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.js";
import { requirePlatformRole } from "../middlewares/platform-admin.js";
import { ApiError } from "../../errors/api-error.js";
import { AiAdminService } from "../../services/ai-admin.service.js";

export const adminAiRouter = Router();
const read = [authenticate, requirePlatformRole()];
const write = [authenticate, requirePlatformRole("PLATFORM_SUPER_ADMIN", "PLATFORM_ADMIN", "OPS")];

adminAiRouter.get("/summary", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.summary() }); } catch (e) { next(e); } });
adminAiRouter.get("/agents", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.listAgents() }); } catch (e) { next(e); } });
adminAiRouter.patch("/agents/:id", ...write, async (req, res, next) => { try { const parsed = z.object({ enabled: z.boolean().optional(), autonomyLevel: z.enum(["L0", "L1", "L2", "L3"]).optional() }).refine((v) => Object.keys(v).length > 0).safeParse(req.body); if (!parsed.success) throw new ApiError(400, "Invalid AI agent update payload", "INVALID_PAYLOAD", parsed.error.flatten()); res.json({ success: true, data: await AiAdminService.updateAgent(req.params.id, parsed.data, { userId: req.user!.id, role: req.platformRoles![0] }) }); } catch (e) { next(e); } });
adminAiRouter.get("/runs", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.listRuns() }); } catch (e) { next(e); } });
adminAiRouter.get("/approvals", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.listApprovals() }); } catch (e) { next(e); } });
adminAiRouter.post("/approvals/:id/approve", ...write, async (req, res, next) => { try { res.json({ success: true, data: await AiAdminService.reviewApproval(req.params.id, "APPROVED", { userId: req.user!.id, role: req.platformRoles![0] }) }); } catch (e) { next(e); } });
adminAiRouter.post("/approvals/:id/reject", ...write, async (req, res, next) => { try { res.json({ success: true, data: await AiAdminService.reviewApproval(req.params.id, "REJECTED", { userId: req.user!.id, role: req.platformRoles![0] }) }); } catch (e) { next(e); } });
adminAiRouter.get("/automations", ...read, async (_req, res) => { res.json({ success: true, data: [], unavailable: "No platform automation records are configured." }); });
adminAiRouter.get("/policies", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.listPolicies() }); } catch (e) { next(e); } });
adminAiRouter.get("/usage", ...read, async (_req, res, next) => { try { res.json({ success: true, data: await AiAdminService.listUsage() }); } catch (e) { next(e); } });
const executeToolSchema = z.object({
  agentId: z.string().uuid(),
  toolName: z.string().trim().min(1),
  approvalId: z.string().uuid().optional(),
});
adminAiRouter.post("/runs/:runId/execute-tool", ...write, async (req, res, next) => {
  try {
    const parsed = executeToolSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid tool execution payload", "INVALID_PAYLOAD", parsed.error.flatten());
    const result = await AiAdminService.executeAgentTool({
      agentId: parsed.data.agentId,
      runId: req.params.runId,
      toolName: parsed.data.toolName,
      approvalId: parsed.data.approvalId,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});
