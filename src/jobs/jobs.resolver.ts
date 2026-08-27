import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { JobsService } from './jobs.service';
import { Job } from './models/job.model';
import { JobRun } from './models/job-run.model';
import { StepRun } from './models/step-run.model';
import { CreateJobInput } from './dto/create-job.input';
import { UpdateJobInput } from './dto/update-job.input';

@Resolver(() => Job)
export class JobsResolver {
  constructor(private jobsService: JobsService) { }

  @Query(() => [Job])
  async jobs() {
    return this.jobsService.findAll();
  }

  @Query(() => Job)
  async job(@Args('id', { type: () => Int }) id: number) {
    return this.jobsService.findOne(id);
  }

  @Query(() => [JobRun])
  async allRuns() {
    return this.jobsService.allRuns();
  }

  @Mutation(() => Job)
  async createJob(@Args('input') input: CreateJobInput) {
    return this.jobsService.create(input);
  }

  @Mutation(() => Job)
  async updateJob(@Args('input') input: UpdateJobInput) {
    return this.jobsService.update(input);
  }

  @Mutation(() => Boolean)
  async removeJob(@Args('id', { type: () => Int }) id: number) {
    return this.jobsService.remove(id);
  }

  @Mutation(() => Boolean)
  async runJob(@Args('id', { type: () => Int }) id: number) {
    return this.jobsService.run(id);
  }

  @ResolveField(() => [JobRun])
  async runs(@Parent() job: Job) {
    return this.jobsService.runs(job.id);
  }
}

@Resolver(() => JobRun)
export class JobRunResolver {
  constructor(private jobsService: JobsService) { }

  @ResolveField(() => Job)
  async job(@Parent() run: JobRun) {
    return this.jobsService.findOne(run.jobId);
  }

  @ResolveField(() => [StepRun])
  async stepRuns(@Parent() run: JobRun) {
    return this.jobsService.stepRuns(run.id);
  }
}
