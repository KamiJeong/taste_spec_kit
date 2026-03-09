import { Field, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class ChannelUserNode {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;
}

@ObjectType()
export class ChannelMemberNode {
  @Field(() => ChannelUserNode)
  user!: ChannelUserNode;

  @Field()
  role!: string;

  @Field()
  joinedAt!: string;

  @Field()
  updatedAt!: string;
}

@ObjectType()
export class ChannelNode {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  ownerUserId!: string;

  @Field()
  role!: string;

  @Field(() => Int, { nullable: true })
  sortIndex!: number | null;

  @Field(() => ChannelUserNode, { nullable: true })
  creator!: ChannelUserNode | null;

  @Field(() => [ChannelMemberNode])
  users!: ChannelMemberNode[];
}

@ObjectType()
export class ChannelListResult {
  @Field(() => [ChannelNode])
  channels!: ChannelNode[];
}

@ObjectType()
export class CreateChannelResult {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  role!: string;
}
