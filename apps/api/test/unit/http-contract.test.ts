import assert from "node:assert/strict";
import { failure, success } from "../../src/modules/shared/http-contract";

function isIso(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

const ok = success({ id: "u1" }, { requestId: "req-1" });
assert.equal(ok.success, true);
assert.equal(ok.data.id, "u1");
assert.equal(ok.meta.requestId, "req-1");
assert.equal(typeof ok.meta.serverTime, "string");
assert.equal(isIso(ok.meta.serverTime), true);

const err = failure("VALIDATION_ERROR", "bad request", { field: "email" }, { requestId: "req-2" });
assert.equal(err.success, false);
assert.equal(err.code, "VALIDATION_ERROR");
assert.equal(err.message, "bad request");
assert.deepEqual(err.details, { field: "email" });
assert.equal(err.meta.requestId, "req-2");
assert.equal(typeof err.meta.serverTime, "string");
assert.equal(isIso(err.meta.serverTime), true);

console.log("unit: http contract helpers ok");
