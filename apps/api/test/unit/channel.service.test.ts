import assert from "node:assert/strict";
import { ChannelService } from "../../src/modules/channel/channel.service";
import {
  canKickTarget,
  canManageManager,
  canQuit,
  canReviewJoinRequests,
  canTransferOwnership
} from "../../src/modules/channel/channel-role.util";

type MockState = {
  ownedChannels: number;
  joinedChannels: number;
};

function buildService(state: MockState) {
  const persistence = {
    findUserById: async (userId: string) => ({ id: userId, email: "user@example.com" }),
    countOwnedChannels: async () => state.ownedChannels,
    createChannel: async () => undefined,
    upsertChannelMember: async () => undefined,
    findChannelById: async () => ({ id: "ch-1", name: "channel", ownerUserId: "owner-1" }),
    findChannelMember: async () => null,
    countMemberships: async () => state.joinedChannels,
    findPendingJoinRequest: async () => null,
    createJoinRequest: async () => undefined
  };
  const sessions = {
    getUserId: async () => "user-1"
  };
  const auditLogs = {
    record: async () => undefined
  };

  return new ChannelService(persistence as any, sessions as any, auditLogs as any, {});
}

async function testCreateChannelLimit() {
  const service = buildService({ ownedChannels: 10, joinedChannels: 0 });
  const result = await service.createChannel(
    { sid: "sid-1", name: "new channel" },
    { ip: "127.0.0.1", userAgent: "unit-test" }
  );
  assert.equal(result.status, 409);
  assert.equal((result.body as any).code, "CHANNEL_CREATE_LIMIT_REACHED");
}

async function testJoinLimitBoundary() {
  process.env.CHANNEL_MAX_JOINED = "2";
  try {
    const service = buildService({ ownedChannels: 0, joinedChannels: 2 });
    const result = await service.createJoinRequest(
      { sid: "sid-1", channelId: "ch-1" },
      { ip: "127.0.0.1", userAgent: "unit-test" }
    );
    assert.equal(result.status, 409);
    assert.equal((result.body as any).code, "CHANNEL_JOIN_LIMIT_REACHED");
  } finally {
    delete process.env.CHANNEL_MAX_JOINED;
  }
}

function testRoleUtilities() {
  assert.equal(canReviewJoinRequests("owner"), true);
  assert.equal(canReviewJoinRequests("manager"), true);
  assert.equal(canReviewJoinRequests("member"), false);

  assert.equal(canManageManager("owner", "member"), true);
  assert.equal(canManageManager("owner", "owner"), false);
  assert.equal(canManageManager("manager", "member"), false);

  assert.equal(canKickTarget("owner", "manager"), true);
  assert.equal(canKickTarget("owner", "member"), true);
  assert.equal(canKickTarget("owner", "owner"), false);
  assert.equal(canKickTarget("manager", "member"), true);
  assert.equal(canKickTarget("manager", "manager"), false);
  assert.equal(canKickTarget("manager", "owner"), false);
  assert.equal(canKickTarget("member", "member"), false);

  assert.equal(canQuit("owner"), false);
  assert.equal(canQuit("manager"), true);
  assert.equal(canQuit("member"), true);

  assert.equal(canTransferOwnership("owner", "member"), true);
  assert.equal(canTransferOwnership("owner", "manager"), true);
  assert.equal(canTransferOwnership("owner", "owner"), false);
  assert.equal(canTransferOwnership("manager", "member"), false);
}

async function run() {
  testRoleUtilities();
  await testCreateChannelLimit();
  await testJoinLimitBoundary();
  console.log("unit: channel service permissions/limits ok");
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
