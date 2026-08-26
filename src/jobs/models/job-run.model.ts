import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class JobRun {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  jobId!: number;

  @Field()
  status!: string;

  @Field()
  trigger!: string;

  @Field(() => Date, { nullable: true })
  startedAt?: Date;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Date)
  createdAt!: Date;
}
