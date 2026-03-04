import assert from "node:assert/strict";
import {
  createChannelPostSchema,
  listChannelPostsQuerySchema,
  updateChannelPostSchema
} from "../../src/modules/channel-post/channel-post.schemas";

const createOk = createChannelPostSchema.safeParse({
  title: "Notice",
  content: "Body"
});
assert.equal(createOk.success, true);

const createInvalid = createChannelPostSchema.safeParse({
  title: " ",
  content: "Body"
});
assert.equal(createInvalid.success, false);

const listDefault = listChannelPostsQuerySchema.parse({});
assert.equal(listDefault.limit, 20);
assert.equal(listDefault.cursor, undefined);

const listInvalid = listChannelPostsQuerySchema.safeParse({ limit: 100 });
assert.equal(listInvalid.success, false);

const updateOk = updateChannelPostSchema.safeParse({
  content: "updated",
  ifUpdatedAt: "2026-03-04T08:00:00.000Z"
});
assert.equal(updateOk.success, true);

const updateNoField = updateChannelPostSchema.safeParse({
  ifUpdatedAt: "2026-03-04T08:00:00.000Z"
});
assert.equal(updateNoField.success, false);

console.log("unit: channel-post schemas ok");
