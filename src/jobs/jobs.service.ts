import { Injectable, NotFoundException } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobInput } from './dto/create-job.input';
import { UpdateJobInput } from './dto/update-job.input';
import { SchedulerService } from '../scheduler/scheduler.service';
import { QueueService } from '../queue/queue.service';

/** Привести произвольный JSON-объект из GraphQL-входа к типу Prisma. */
function toInputJson(value?: Record<string, unknown>): InputJsonValue | undefined {
  return value as InputJsonValue;
}

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private schedulerService: SchedulerService,
    private queueService: QueueService,
  ) { }

  async findAll() {
    return this.prisma.job.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }

  async create(input: CreateJobInput) {
    const job = await this.prisma.job.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        cron: input.cron,
        timezone: input.timezone ?? 'UTC',
        enabled: input.enabled ?? true,
        params: toInputJson(input.params),
      },
    });
    await this.schedulerService.rescheduleJob(job);
    return job;
  }

  async update(input: UpdateJobInput) {
    const existing = await this.prisma.job.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new NotFoundException(`Job ${input.id} not found`);
    }
    const job = await this.prisma.job.update({
      where: { id: input.id },
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        cron: input.cron,
        timezone: input.timezone,
        enabled: input.enabled,
        params: toInputJson(input.params),
      },
    });
    await this.schedulerService.rescheduleJob(job);
    return job;
  }

  async remove(id: number) {
    const existing = await this.prisma.job.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    await this.schedulerService.unregisterJob(existing.key);
    await this.prisma.job.delete({ where: { id } });
    return true;
  }

  async run(id: number) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    await this.queueService.enqueueJob(job.id, 'manual');
    return true;
  }

  async runs(jobId: number) {
    return this.prisma.jobRun.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async allRuns() {
    return this.prisma.jobRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async stepRuns(jobRunId: number) {
    return this.prisma.stepRun.findMany({
      where: { jobRunId },
      orderBy: { startedAt: 'asc' },
    });
  }
}
