import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StepRun {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  jobRunId!: number;

  @Field()
  stepId!: string;

  @Field()
  type!: string;

  @Field()
  status!: string;

  @Field({ nullable: true })
  input?: string;

  @Field({ nullable: true })
  output?: string;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Date, { nullable: true })
  startedAt?: Date;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date;
}
