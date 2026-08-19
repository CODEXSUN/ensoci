import type { SocialScheduleRepository } from "./schedule.repository.js";
import type {
  SocialSchedule,
  ScheduleStatus,
  SocialMediaRuntimeContext,
  SocialMediaModuleDependencies
} from "../_shared/types.js";

export class SocialScheduleService {
  constructor(
    private readonly repository: SocialScheduleRepository,
    private readonly dependencies: SocialMediaModuleDependencies
  ) {}

  async list(
    ctx: SocialMediaRuntimeContext,
    filters?: { status?: ScheduleStatus; from?: string; to?: string; limit?: number; offset?: number }
  ): Promise<SocialSchedule[]> {
    return this.repository.list(ctx.tenantId, filters);
  }

  async get(ctx: SocialMediaRuntimeContext, uuid: string): Promise<SocialSchedule | null> {
    return this.repository.findByUuid(uuid, ctx.tenantId);
  }

  async create(
    ctx: SocialMediaRuntimeContext,
    data: { postId: number; scheduledAt: string; timezone: string }
  ): Promise<SocialSchedule> {
    return this.repository.create(ctx.tenantId, data);
  }

  async cancel(ctx: SocialMediaRuntimeContext, uuid: string): Promise<boolean> {
    return this.repository.cancel(uuid, ctx.tenantId);
  }

  async processPending(): Promise<number> {
    const pending = await this.repository.findPending(10);
    let processed = 0;

    for (const schedule of pending) {
      try {
        await this.repository.updateStatus(schedule.uuid, "processing");
        await this.dependencies.enqueue({
          type: "social.schedule.process",
          scheduleId: schedule.uuid
        });
        processed++;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown error";
        await this.repository.updateStatus(schedule.uuid, "failed", reason);
      }
    }

    return processed;
  }

  async counts(ctx: SocialMediaRuntimeContext): Promise<Record<ScheduleStatus, number>> {
    return this.repository.count(ctx.tenantId);
  }

  async upcoming(ctx: SocialMediaRuntimeContext, limit: number): Promise<SocialSchedule[]> {
    return this.repository.upcoming(ctx.tenantId, limit);
  }
}
