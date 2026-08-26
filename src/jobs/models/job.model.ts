import { Field, Int, ObjectType } from '@nestjs/graphql';

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

  @Field({
    nullable: true,
    description: 'Pipeline steps config serialized as JSON string',
  })
  params?: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
