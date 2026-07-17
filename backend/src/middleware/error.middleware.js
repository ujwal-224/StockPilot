const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid resource identifier" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, message: "The submitted data is invalid" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "That record already exists" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode && err.statusCode < 500 ? err.message : "Internal Server Error",
  });
};

export { errorHandler };
