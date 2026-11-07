module.exports = class BaseError extends Error {
  constructor(statusCode, message, error = []) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
  static BadRequest(message, errors = []) {
    return new BaseError(400, message, errors);
  }
  static Unauthorized(message = "Unauthorized") {
    return new BaseError(401, message);
  }
  static Forbidden(message = "Forbidden") {
    return new BaseError(403, message);
  }
  static NotFound(message = "Not Found") {
    return new BaseError(404, message);
  }
};
