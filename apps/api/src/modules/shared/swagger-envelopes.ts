const metaSchema = {
  type: "object",
  properties: {
    serverTime: {
      type: "string",
      format: "date-time"
    }
  },
  required: ["serverTime"],
  additionalProperties: true
};

export const successEnvelopeSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", enum: [true as boolean] },
    data: {},
    meta: metaSchema
  },
  required: ["success", "data", "meta"]
};

export const errorEnvelopeSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", enum: [false as boolean] },
    code: { type: "string" },
    message: { type: "string" },
    details: { nullable: true },
    meta: metaSchema
  },
  required: ["success", "code", "message", "details", "meta"]
};
