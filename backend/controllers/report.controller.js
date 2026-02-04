import Report from "../models/report.model.js";
import Listing from "../models/listing.model.js";

export const createReport = async (req, res) => {
  try {
    // 1. Lấy ID người báo cáo từ Token (Middleware verifyToken đã gán vào req)
    const reporterId = req.userId;

    const { listingId, reason, detail } = req.body;

    // Validate required fields
    if (!listingId || !reason) {
      return res.status(400).json({ message: "listingId và reason là bắt buộc" });
    }

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    // Check if user already reported this listing (tránh spam)
    const existingReport = await Report.findOne({
      reporter: reporterId,
      listing: listingId,
      status: "pending",
    });

    if (existingReport) {
      return res
        .status(400)
        .json({ message: "Bạn đã báo cáo bài đăng này rồi" });
    }

    // Create new report
    const newReport = new Report({
      reporter: reporterId,
      listing: listingId,
      reason,
      detail: detail || "",
    });

    await newReport.save();

    return res.status(201).json({
      message: "Báo cáo đã được gửi thành công",
      report: newReport,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    return res.status(500).json({ message: "Server error" });
  }
};