import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateJobInput {
  @Field()
  @IsString()
  key!: string;

  @Field()
  @IsString()
  name!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsString()
  cron!: string;

  @Field({ nullable: true, defaultValue: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field(() => GraphQLJSON, {
    nullable: true,
    description: 'Pipeline steps config as JSON object, e.g. {"steps":[...]}',
  })
  @IsOptional()
  params?: Record<string, unknown>;
}
