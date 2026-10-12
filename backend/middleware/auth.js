import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

export const verifyUserParam = (req, res, next) => {
  if (req.params.userId && req.params.userId !== req.userId.toString()) {
    return res.status(403).json({ error: "You can only access your own data" });
  }
  next();
};
