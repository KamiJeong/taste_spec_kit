import assert from "node:assert/strict";
import { TokenService } from "../../src/modules/token/token.service";

const service = new TokenService();

const issuedVerification = service.issueVerificationToken();
assert.equal(typeof issuedVerification.token, "string");
assert.equal(issuedVerification.token.length, 48);
assert.equal(issuedVerification.tokenHash, service.hashToken(issuedVerification.token));
assert.ok(issuedVerification.expiresAt > Date.now());

const issuedReset = service.issuePasswordResetToken();
assert.equal(typeof issuedReset.token, "string");
assert.equal(issuedReset.token.length, 48);
assert.equal(issuedReset.tokenHash, service.hashToken(issuedReset.token));
assert.ok(issuedReset.expiresAt > Date.now());
assert.ok(issuedVerification.expiresAt > issuedReset.expiresAt);

console.log("unit: token service issue/hash ok");
