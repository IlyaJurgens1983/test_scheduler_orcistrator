import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [forwardRef(() => ExecutionModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule { }
