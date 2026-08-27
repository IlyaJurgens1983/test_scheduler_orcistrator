import { Field, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class Job {
  @Field(() => Int)
  id!: number;

  @Field()
  key!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  cron!: string;

  @Field()
  timezone!: string;

  @Field()
  enabled!: boolean;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Pipeline steps config as JSON object, e.g. {"steps":[...]}',
  })
  params?: Record<string, unknown>;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
