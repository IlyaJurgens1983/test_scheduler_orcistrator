import { Module, forwardRef } from '@nestjs/common';
import { PipelineRunnerService } from './pipeline-runner.service';
import { WebhookExecutor } from './executors/webhook.executor';
import { BusinessCardExecutor } from './executors/business-card.executor';
import { EmailExecutor } from './executors/email.executor';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [forwardRef(() => QueueModule)],
  providers: [
    PipelineRunnerService,
    WebhookExecutor,
    BusinessCardExecutor,
    EmailExecutor,
  ],
  exports: [PipelineRunnerService],
})
export class ExecutionModule { }
