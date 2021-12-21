const errorHandler = function (err, req, res, next) {
  if (err.name == "UnauthorizedError") {
    return res.status(400).json({ err: "User not authorized" });
  }
  if (err) {
    return res.status(400).json({ error: err });
  }

  next();
};

module.exports = errorHandler;
