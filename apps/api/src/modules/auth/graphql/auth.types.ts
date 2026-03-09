import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AuthMeUserNode {
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
export class AuthMeResult {
  @Field(() => AuthMeUserNode)
  user!: AuthMeUserNode;
}
