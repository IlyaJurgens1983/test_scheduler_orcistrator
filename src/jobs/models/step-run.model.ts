import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

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

  @Field(() => GraphQLJSON, { nullable: true })
  input?: Record<string, unknown>;

  @Field(() => GraphQLJSON, { nullable: true })
  output?: Record<string, unknown>;

  @Field({ nullable: true })
  error?: string;

  @Field(() => Date, { nullable: true })
  startedAt?: Date;

  @Field(() => Date, { nullable: true })
  finishedAt?: Date;
}
