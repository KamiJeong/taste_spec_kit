import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ChannelPostNode {
  @Field()
  id!: string;

  @Field()
  channelId!: string;

  @Field()
  authorUserId!: string;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
export class ChannelPostConnection {
  @Field(() => [ChannelPostNode])
  items!: ChannelPostNode[];

  @Field(() => String, { nullable: true })
  nextCursor!: string | null;
}

@ObjectType()
export class CreateChannelPostResult {
  @Field(() => ChannelPostNode)
  post!: ChannelPostNode;
}
