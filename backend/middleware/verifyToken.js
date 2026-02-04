import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    console.warn("verifyToken: missing token", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    return res.status(401).json({ message: "Chưa đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
    if (err) {
      console.warn("verifyToken: invalid token", {
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: err.message,
      });
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }

    req.userId = payload._id || payload.id;

    next();
  });
};
