import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsResolver, JobRunResolver } from './jobs.resolver';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [SchedulerModule, QueueModule],
  providers: [JobsService, JobsResolver, JobRunResolver],
  exports: [JobsService],
})
export class JobsModule { }
