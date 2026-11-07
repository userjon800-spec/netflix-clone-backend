const { test, describe } = require("node:test");
const assert = require("node:assert");
const BaseError = require("../errors/base.error");
const { getCookieOptions } = require("../utils/cookie");

describe("Netflix Clone API Suite", () => {
  test("BaseError.BadRequest produces statusCode 400 and custom message", () => {
    const error = BaseError.BadRequest(400, "Xato so'rov");
    assert.strictEqual(error.statusCode, 400);
    assert.strictEqual(error.message, "Xato so'rov");
    assert.ok(Array.isArray(error.error));
  });

  test("BaseError.Unauthorized returns statusCode 401", () => {
    const error = BaseError.UnAuthorized(401, "Kirish taqiqlangan");
    assert.strictEqual(error.statusCode, 401);
    assert.strictEqual(error.message, "Kirish taqiqlangan");
  });

  test("BaseError.Forbidden returns statusCode 403", () => {
    const error = BaseError.Forbidden(403, "Ruxsat berilmagan");
    assert.strictEqual(error.statusCode, 403);
  });

  test("Cookie options helper enforces secure in production", () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      const prodOpts = getCookieOptions();
      assert.strictEqual(prodOpts.secure, true);
      assert.strictEqual(prodOpts.sameSite, "none");
      assert.strictEqual(prodOpts.httpOnly, true);

      process.env.NODE_ENV = "development";
      const devOpts = getCookieOptions();
      assert.strictEqual(devOpts.secure, false);
      assert.strictEqual(devOpts.sameSite, "lax");
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});
