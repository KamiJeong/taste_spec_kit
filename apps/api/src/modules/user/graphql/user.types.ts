import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UserProfileNode {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field()
  createdAt!: string;
}

@ObjectType()
export class UserProfileResult {
  @Field(() => UserProfileNode)
  profile!: UserProfileNode;
}
