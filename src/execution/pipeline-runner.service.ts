import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StepExecutor } from './step-executor.interface';
import { WebhookExecutor } from './executors/webhook.executor';
import { BusinessCardExecutor } from './executors/business-card.executor';
import { EmailExecutor } from './executors/email.executor';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class PipelineRunnerService {
  private executors: Map<string, StepExecutor> = new Map();

  constructor(
    private prisma: PrismaService,
    private webhookExecutor: WebhookExecutor,
    private businessCardExecutor: BusinessCardExecutor,
    private emailExecutor: EmailExecutor,
    @Inject(forwardRef(() => QueueService))
    private queueService: QueueService,
  ) {
    this.executors.set('webhook.call', this.webhookExecutor);
    this.executors.set('business_card.generate', this.businessCardExecutor);
    this.executors.set('email.send', this.emailExecutor);
  }

  async executeJob(jobId: number, trigger: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      console.error(`PipelineRunner: job ${jobId} not found`);
      return;
    }

    const params = (job.params as Record<string, unknown>) || {};
    const steps = (params.steps || []) as Array<Record<string, unknown>>;

    if (steps.length === 0) {
      console.warn(`PipelineRunner: job ${jobId} has no steps, skipping`);
      return;
    }

    const run = await this.prisma.jobRun.create({
      data: {
        jobId,
        trigger,
        status: 'running',
        startedAt: new Date(),
      },
    });

    const context: Record<string, unknown> = {};

    try {
      for (const step of steps) {
        const stepId = (step.id as string) || `step-${Math.random()}`;
        const type = step.type as string;
        const config = (step.config as Record<string, unknown>) || {};

        const executor = this.executors.get(type);
        if (!executor) {
          throw new Error(`Unknown step type: ${type}`);
        }

        const stepRun = await this.prisma.stepRun.create({
          data: {
            jobRunId: run.id,
            stepId,
            type,
            status: 'running',
            input: config as Prisma.InputJsonValue,
            startedAt: new Date(),
          },
        });

        try {
          const output = await executor.execute(config, context);
          context[stepId] = output;
          await this.prisma.stepRun.update({
            where: { id: stepRun.id },
            data: {
              status: 'success',
              output: output as Prisma.InputJsonValue,
              finishedAt: new Date(),
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await this.prisma.stepRun.update({
            where: { id: stepRun.id },
            data: { status: 'failed', error: message, finishedAt: new Date() },
          });
          throw err;
        }
      }

      await this.prisma.jobRun.update({
        where: { id: run.id },
        data: { status: 'success', finishedAt: new Date() },
      });
      console.log(
        `[run #${run.id}] job ${jobId} finished successfully (${trigger})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.jobRun.update({
        where: { id: run.id },
        data: { status: 'failed', error: message, finishedAt: new Date() },
      });
      console.error(`[run #${run.id}] job ${jobId} failed: ${message}`);
    }
  }
}
