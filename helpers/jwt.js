const expressJwt = require("express-jwt");

const jwt = function () {
  return expressJwt({
    secret: process.env.SECRET,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
  }).unless({
    path: [
      { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      "/api/v1/users/login",
      "/api/v1/users/register",
    ],
  });
};

function isRevoked(req, payload, done) {
  if (!payload.isAdmin) {
    done(null, true);
  }

  return done();
}

module.exports = jwt;
