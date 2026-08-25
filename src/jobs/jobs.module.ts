import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsResolver, JobRunResolver } from './jobs.resolver';

@Module({
  providers: [JobsService, JobsResolver, JobRunResolver],
  exports: [JobsService],
})
export class JobsModule {}
