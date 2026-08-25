import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { Job } from '@prisma/client';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private jobs = new Map<string, CronJob>();

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private queueService: QueueService,
  ) {}

  async onModuleInit() {
    await this.loadJobs();
  }

  async loadJobs() {
    const jobs = await this.prisma.job.findMany({ where: { enabled: true } });
    for (const job of jobs) {
      this.registerJob(job);
    }
  }

  registerJob(job: Job) {
    try {
      const cronJob = new CronJob(
        job.cron,
        async () => {
          await this.queueService.enqueueJob(job.id, 'cron');
        },
        null,
        true,
        job.timezone,
      );
      this.schedulerRegistry.addCronJob(job.key, cronJob);
      cronJob.start();
      this.jobs.set(job.key, cronJob);
      console.log(`Scheduler: registered job ${job.key} (${job.cron})`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`Scheduler: failed to register job ${job.key}: ${message}`);
    }
  }

  unregisterJob(key: string) {
    const cronJob = this.jobs.get(key);
    if (cronJob) {
      cronJob.stop();
      this.jobs.delete(key);
    }
    try {
      this.schedulerRegistry.deleteCronJob(key);
    } catch {
      // not registered, ignore
    }
  }

  async rescheduleJob(job: Job) {
    this.unregisterJob(job.key);
    if (job.enabled) {
      this.registerJob(job);
    }
  }
}
