module.exports = class BaseError extends Error {
  constructor(message, statusCode, error = []) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
  static BadRequest(message, errors = []) {
    return new BaseError(400, message, errors);
  }
  static Unauthorized() {
    return new BaseError(401, "Unauthorized");
  }
};