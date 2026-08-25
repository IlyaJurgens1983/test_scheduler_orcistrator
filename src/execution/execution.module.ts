import { Module } from '@nestjs/common';
import { PipelineRunnerService } from './pipeline-runner.service';
import { WebhookExecutor } from './executors/webhook.executor';
import { BusinessCardExecutor } from './executors/business-card.executor';
import { EmailExecutor } from './executors/email.executor';

@Module({
  providers: [
    PipelineRunnerService,
    WebhookExecutor,
    BusinessCardExecutor,
    EmailExecutor,
  ],
  exports: [PipelineRunnerService],
})
export class ExecutionModule {}
