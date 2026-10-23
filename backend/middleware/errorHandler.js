export function errorHandler(err, req, res, next) {
  console.error("API Error:", err.stack || err.message || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message || "An unexpected server error occurred",
    ...(process.env.NODE_ENV === "development" && { details: err.stack }),
  });
}

export default errorHandler;
