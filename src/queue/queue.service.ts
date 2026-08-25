import {
  Inject,
  Injectable,
  OnModuleDestroy,
  forwardRef,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineRunnerService } from '../execution/pipeline-runner.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private queue: Queue;
  private worker: Worker;
  private connection: IORedis;

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PipelineRunnerService))
    private pipelineRunner: PipelineRunnerService,
  ) {
    this.connection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue('scheduler', { connection: this.connection });

    this.worker = new Worker(
      'scheduler',
      async (job) => {
        const { jobId, trigger } = job.data;
        await this.pipelineRunner.executeJob(jobId, trigger);
      },
      { connection: this.connection, concurrency: 2 },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`Worker failed on job ${job?.id}: ${err.message}`);
    });
  }

  async enqueueJob(jobId: number, trigger: string) {
    await this.queue.add('run-job', { jobId, trigger });
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
