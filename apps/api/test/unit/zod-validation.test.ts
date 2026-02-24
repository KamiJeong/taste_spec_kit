import assert from "node:assert/strict";
import { z } from "zod";
import { validateWithZod } from "../../src/modules/shared/zod-validation";

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().positive()
});

const valid = validateWithZod(schema, { email: "user@example.com", age: 20 });
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.data.email, "user@example.com");
  assert.equal(valid.data.age, 20);
}

const invalid = validateWithZod(schema, { email: "invalid", age: -1 });
assert.equal(invalid.ok, false);
if (!invalid.ok) {
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.response.body.success, false);
  assert.equal(invalid.response.body.code, "VALIDATION_ERROR");
}

console.log("unit: zod validation helper ok");
