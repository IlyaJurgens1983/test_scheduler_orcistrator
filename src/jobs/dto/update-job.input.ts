import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class UpdateJobInput {
  @Field(() => Int)
  id!: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  key?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cron?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  params?: Record<string, unknown>;
}
