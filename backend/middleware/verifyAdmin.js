import User from "../models/user.model.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("role isBanned");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isBanned) return res.status(403).json({ message: "User is banned" });
    if (user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    next();
  } catch (error) {
    console.error("verifyAdmin error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
