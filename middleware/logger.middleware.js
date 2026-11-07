/**
 * Zero-dependency structured HTTP request logger middleware
 * Logs timestamp, HTTP method, URL, status code, and response time with ANSI colors.
 */
const loggerMiddleware = (req, res, next) => {
  // Skip logging health checks to reduce log noise
  if (req.path === "/health") {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // ANSI color coding based on status code
    const color =
      statusCode >= 500
        ? "\x1b[31m" // Red (server error)
        : statusCode >= 400
        ? "\x1b[33m" // Yellow (client error)
        : statusCode >= 300
        ? "\x1b[36m" // Cyan (redirect)
        : "\x1b[32m"; // Green (success)
    const reset = "\x1b[0m";
    const dim = "\x1b[2m";

    const timestamp = new Date().toLocaleTimeString("en-GB", { hour12: false });
    console.log(
      `${dim}[${timestamp}]${reset} ${method} ${originalUrl} ${color}${statusCode}${reset} ${dim}${duration}ms${reset}`
    );
  });

  next();
};

module.exports = loggerMiddleware;
