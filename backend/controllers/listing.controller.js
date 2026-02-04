import mongoose from "mongoose";
import Listing from "../models/listing.model.js";
import Bid from "../models/bid.model.js";
import cloudinary from "../config/cloudinary.js";
import SystemConfig from "../models/systemConfig.model.js";

const getAuctionStatusByTime = (startTime, endTime) => {
  const now = new Date();
  if (endTime && now >= new Date(endTime)) return "ended";
  if (startTime && now >= new Date(startTime)) return "live";
  return "scheduled";
};

const refreshEndedAuctions = async () => {
  const now = new Date();
  await Listing.updateMany(
    {
      auctionStatus: { $ne: "ended" },
      endTime: { $lte: now },
    },
    { $set: { auctionStatus: "ended" } }
  );
};

const normalizeAuctionFields = (listing) => {
  if (!listing) return listing;
  if (!listing.auctionStatus) listing.auctionStatus = "live";
  if (listing.startingPrice == null && listing.price != null) {
    listing.startingPrice = listing.price;
  }
  if (listing.currentPrice == null) {
    listing.currentPrice = listing.startingPrice ?? listing.price ?? 0;
  }
  if (listing.bidIncrement == null) listing.bidIncrement = 100000;
  return listing;
};

const getSystemConfig = async () => {
  let config = await SystemConfig.findOne();
  if (!config) {
    config = await SystemConfig.create({});
  }
  return config;
};

// --- MIDDLEWARE verifyToken ĐÃ ĐẢM BẢO req.userId TỒN TẠI CHO CÁC ROUTE PROTECTED ---

export const createList = async (req, res) => {
  try {
    // 1. Lấy ID từ Token (thay cho Session)
    const ownerId = req.userId;

    const {
      title,
      description,
      area,
      price,
      startingPrice,
      bidIncrement,
      auctionType,
      antiSnipingWindowSec,
      antiSnipingExtensionSec,
      startTime,
      endTime,
      reservePrice,
      depositAmount,
      property_type,
      rental_type,
      location,
      amenities,
      bedroom,
      bathroom,
    } = req.body;

    const province = location?.province;
    const ward = location?.ward;
    const detail = location?.detail;
    const longitude = location?.longitude;
    const latitude = location?.latitude;
    const validAmenities = Array.isArray(amenities) ? amenities : [];

    if (
      !title ||
      !area ||
      (!price && !startingPrice) ||
      !property_type ||
      !rental_type ||
      !province ||
      !ward ||
      !detail
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const startAt = startTime ? new Date(startTime) : new Date();
    const endAt = endTime
      ? new Date(endTime)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return res.status(400).json({ message: "Invalid auction time" });
    }

    if (endAt <= startAt) {
      return res.status(400).json({ message: "Auction endTime must be after startTime" });
    }

    const systemConfig = await getSystemConfig();

    const startingPriceValue = Number(startingPrice ?? price);
    const incrementValue = bidIncrement ? Number(bidIncrement) : 100000;

    // Xử lý ảnh
    let images = [];
    if (req.body.images) {
      if (Array.isArray(req.body.images)) images = req.body.images;
      else if (typeof req.body.images === "string")
        images = req.body.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    }

    if (images.length > 10)
      return res.status(400).json({ message: "Max 10 images allowed" });

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    let savedImages = [];
    if (images.length > 0) {
      if (hasCloudinary) {
        const cloudinaryImages = await Promise.all(
          images.map((img) =>
            cloudinary.uploader.upload(img, { folder: "products" })
          )
        );

        if (cloudinaryImages.length !== images.length) {
          return res.status(500).json({ message: "Image upload failed" });
        }

        savedImages = cloudinaryImages.map((img) => ({
          url: img.secure_url,
          public_id: img.public_id,
        }));
      } else {
        savedImages = images.map((img) => ({ url: img }));
      }
    }

    const finalLat = latitude ? parseFloat(latitude) : 21.028511;
    const finalLng = longitude ? parseFloat(longitude) : 105.854444;

    const list = new Listing({
      title,
      description,
      area: Number(area),
      price: startingPriceValue,
      startingPrice: startingPriceValue,
      currentPrice: startingPriceValue,
      bidIncrement: incrementValue,
      auctionType: auctionType || "english",
      antiSnipingWindowSec:
        antiSnipingWindowSec !== undefined
          ? Number(antiSnipingWindowSec)
          : systemConfig.antiSnipingWindowSec,
      antiSnipingExtensionSec:
        antiSnipingExtensionSec !== undefined
          ? Number(antiSnipingExtensionSec)
          : systemConfig.antiSnipingExtensionSec,
      reservePrice: reservePrice ? Number(reservePrice) : undefined,
      startTime: startAt,
      endTime: endAt,
      auctionStatus: getAuctionStatusByTime(startAt, endAt),
      bidCount: 0,
      status: "approved", // no moderation
      depositAmount:
        req.body.depositAmount !== undefined
          ? Number(req.body.depositAmount)
          : systemConfig.defaultDepositAmount,
      property_type,
      rental_type,
      images: savedImages,
      owner: ownerId, // Dùng ID từ JWT
      bedroom: bedroom ? Number(bedroom) : 0,
      bathroom: bathroom ? Number(bathroom) : 0,
      location: {
        province,
        ward,
        detail,
        coords: {
          type: "Point",
          coordinates: [finalLng, finalLat],
        },
      },
      amenities: validAmenities,
    });

    await list.save();

    return res.status(201).json({
      message: "Create List Successfully",
      listing: list,
    });
  } catch (error) {
    console.error("createList error:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed: " + error.message });
    }
    return res
      .status(500)
      .json({ message: error.message || "Server error", error: error.message });
  }
};

export const getListings = async (req, res) => {
  try {
    await refreshEndedAuctions();
    const {
      search,
      province,
      property_type,
      rental_type,
        status,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      page,
      limit,
      sort,
      userLat,
      userLng,
      radius,
    } = req.query;

    const query = {};

    if (userLat && userLng && radius) {
      const radiusInMeters = parseFloat(radius) * 1000;
      query["location.coords"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(userLng), parseFloat(userLat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ title: regex }, { description: regex }];
    }

    if (province) query["location.province"] = province;
    if (property_type) query.property_type = property_type;
    if (rental_type) query.rental_type = rental_type;
    // By default, only surface 'approved' listings to public unless explicitly filtered
    if (status) query.status = status;
    if (auctionStatus) {
      if (auctionStatus === "live") {
        query.$or = [
          { auctionStatus: "live" },
          { auctionStatus: { $exists: false } },
          { auctionStatus: null },
        ];
      } else {
        query.auctionStatus = auctionStatus;
      }
    }
    else {
      query.$or = [
        { auctionStatus: { $in: ["scheduled", "live"] } },
        { auctionStatus: { $exists: false } },
        { auctionStatus: null },
      ];
    }

    const minP = minPrice !== undefined ? Number(minPrice) : undefined;
    const maxP = maxPrice !== undefined ? Number(maxPrice) : undefined;
    const minA = minArea !== undefined ? Number(minArea) : undefined;
    const maxA = maxArea !== undefined ? Number(maxArea) : undefined;

    if (minP !== undefined || maxP !== undefined) {
      query.$and = query.$and || [];
      const priceFilter = { $or: [] };
      const currentPrice = {};
      if (minP !== undefined) currentPrice.$gte = minP;
      if (maxP !== undefined) currentPrice.$lte = maxP;
      priceFilter.$or.push({ currentPrice });
      priceFilter.$or.push({ currentPrice: { $exists: false }, price: currentPrice });
      query.$and.push(priceFilter);
    }

    if (minA !== undefined || maxA !== undefined) {
      query.area = {};
      if (minA !== undefined) query.area.$gte = minA;
      if (maxA !== undefined) query.area.$lte = maxA;
    }

    const pageNum = page && Number(page) > 0 ? Number(page) : 1;
    const defaultLimit = 30;
    const lim = limit && Number(limit) > 0 ? Number(limit) : defaultLimit;
    const skip = (pageNum - 1) * lim;

    let sortObj = { createdAt: -1 };
    if (sort) {
      if (sort === "price_asc") sortObj = { currentPrice: 1 };
      else if (sort === "price_desc") sortObj = { currentPrice: -1 };
      else if (sort === "area_asc") sortObj = { area: 1 };
      else if (sort === "area_desc") sortObj = { area: -1 };
      else if (sort === "oldest") sortObj = { createdAt: 1 };
    }

    const listings = await Listing.find(query)
      .populate("owner", "name profile")
      .populate("property_type", "name")
      .sort(sortObj)
      .skip(skip)
      .limit(lim);

    const normalized = listings.map((l) => normalizeAuctionFields(l));

    return res.json({
      message: "Lấy danh sách tin đăng thành công",
      listings: normalized,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getListingById = async (req, res) => {
  try {
    await refreshEndedAuctions();
    const id = req.params.id;
    const listing = await Listing.findById(id)
      .populate("owner", "name profile createdAt phone avatar")
      .populate("property_type", "name");
    if (!listing) return res.status(404).json({ message: "Not Found" });
    const computedStatus = getAuctionStatusByTime(listing.startTime, listing.endTime);
    if (listing.startTime || listing.endTime) {
      if (computedStatus !== listing.auctionStatus) {
        listing.auctionStatus = computedStatus;
        await listing.save();
      }
    } else if (!listing.auctionStatus) {
      listing.auctionStatus = "live";
    }

    normalizeAuctionFields(listing);
    return res.json(listing);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyListings = async (req, res) => {
  try {
    // Lấy userId từ token
    const userId = req.userId;

    // Lấy filter từ query
    const { status } = req.query;

    // Query cơ bản
    const query = { owner: userId };

    // Chỉ filter khi status tồn tại
    if (status) {
      query.status = status;
    }

    const listings = await Listing.find(query)
      .populate("owner", "name profile")
      .populate("property_type", "name")
      .sort({ createdAt: -1 });

    return res.json({
      message: "Lấy bài đăng của tôi thành công",
      listings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserListings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const listings = await Listing.find({ owner: userId })
      .populate("owner", "name profile")
      .populate("property_type", "name")
      .sort({ createdAt: -1 });

    return res.json({ message: "Lấy bài đăng của user thành công", listings });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateListing = async (req, res) => {
  try {
    // 3. Lấy ID từ Token
    const userId = req.userId;
    const id = req.params.id;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chỉnh sửa bài đăng này" });
    }

    // Xử lý images
    let newImages = [];
    if (req.body.images) {
      if (Array.isArray(req.body.images)) newImages = req.body.images;
      else if (typeof req.body.images === "string")
        newImages = req.body.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    }

    const oldImages = listing.images || [];
    const base64Images = newImages.filter(
      (img) => typeof img === "string" && img.startsWith("data:")
    );
    const keptImages = newImages.filter(
      (img) => typeof img === "object" && img.url
    );
    const removedImages = oldImages.filter(
      (old) => !keptImages.some((k) => k.public_id === old.public_id)
    );

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      await Promise.all(
        removedImages.map(async (img) => {
          if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
        })
      );
    }

    let uploadedConverted = [];
    if (base64Images.length > 0) {
      if (hasCloudinary) {
        const uploadedImages = await Promise.all(
          base64Images.map((img) =>
            cloudinary.uploader.upload(img, { folder: "products" })
          )
        );
        uploadedConverted = uploadedImages.map((i) => ({
          url: i.secure_url,
          public_id: i.public_id,
        }));
      } else {
        uploadedConverted = base64Images.map((img) => ({ url: img }));
      }
    }

    const finalImages = [...keptImages, ...uploadedConverted];

    // Cập nhật fields
    const {
      title,
      description,
      area,
      price,
      startingPrice,
      bidIncrement,
      auctionType,
      antiSnipingWindowSec,
      antiSnipingExtensionSec,
      startTime,
      endTime,
      reservePrice,
      depositAmount,
      property_type,
      rental_type,
      location,
      amenities,
      bedroom,
      bathroom,
    } = req.body;

    listing.title = title ?? listing.title;
    listing.description = description ?? listing.description;
    if (area !== undefined) listing.area = Number(area);
    if (price !== undefined || startingPrice !== undefined) {
      const nextStarting = Number(startingPrice ?? price);
      listing.price = nextStarting;
      listing.startingPrice = nextStarting;
      if ((listing.bidCount || 0) === 0) {
        listing.currentPrice = nextStarting;
      }
    }
    listing.status = "approved";
    listing.property_type = property_type ?? listing.property_type;
    listing.rental_type = rental_type ?? listing.rental_type;
    listing.amenities = Array.isArray(amenities)
      ? amenities
      : listing.amenities;
    listing.images = finalImages;
    if (bedroom !== undefined) listing.bedroom = Number(bedroom);
    if (bathroom !== undefined) listing.bathroom = Number(bathroom);

    if (bidIncrement !== undefined) listing.bidIncrement = Number(bidIncrement);
    if (reservePrice !== undefined)
      listing.reservePrice = Number(reservePrice);
    if (depositAmount !== undefined)
      listing.depositAmount = Number(depositAmount);
    if (auctionType) listing.auctionType = auctionType;
    if (antiSnipingWindowSec !== undefined)
      listing.antiSnipingWindowSec = Number(antiSnipingWindowSec);
    if (antiSnipingExtensionSec !== undefined)
      listing.antiSnipingExtensionSec = Number(antiSnipingExtensionSec);

    if (startTime || endTime) {
      const nextStart = startTime ? new Date(startTime) : listing.startTime;
      const nextEnd = endTime ? new Date(endTime) : listing.endTime;
      if (Number.isNaN(nextStart?.getTime()) || Number.isNaN(nextEnd?.getTime())) {
        return res.status(400).json({ message: "Invalid auction time" });
      }
      if (nextEnd && nextStart && nextEnd <= nextStart) {
        return res.status(400).json({ message: "Auction endTime must be after startTime" });
      }
      listing.startTime = nextStart;
      listing.endTime = nextEnd;
      listing.auctionStatus = getAuctionStatusByTime(nextStart, nextEnd);
    }

    if (location) {
      listing.location.province =
        location.province ?? listing.location.province;
      listing.location.ward = location.ward ?? listing.location.ward;
      listing.location.detail = location.detail ?? listing.location.detail;

      if (location.longitude && location.latitude) {
        listing.location.coords = {
          type: "Point",
          coordinates: [
            parseFloat(location.longitude),
            parseFloat(location.latitude),
          ],
        };
      }
    }

    await listing.save();

    return res.json({ message: "Cập nhật thành công", listing });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteListing = async (req, res) => {
  try {
    // 4. Lấy ID từ Token
    const userId = req.userId;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Not Found" });

    if (listing.owner.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài đăng này" });
    }

    await Promise.all(
      listing.images.map(async (img) => {
        if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
      })
    );

    await Listing.findByIdAndDelete(id);

    return res.json({ message: "Tin đăng được xóa thành công" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

export const searchListings = async (req, res) => {
  console.log("Search Params:", req.query);
  try {
    await refreshEndedAuctions();
    const {
      keyword,
      province,
      property_type,
      rental_type,
      bedroom,
      bathroom,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      sort,
      auctionStatus,
      status,
    } = req.query;

    let query = {};
    const andFilters = [];

    if (status) query.status = status;
    if (auctionStatus) {
      if (auctionStatus === "live") {
        andFilters.push({
          $or: [
            { auctionStatus: "live" },
            { auctionStatus: { $exists: false } },
            { auctionStatus: null },
          ],
        });
      } else {
        andFilters.push({ auctionStatus });
      }
    } else {
      andFilters.push({
        $or: [
          { auctionStatus: { $in: ["scheduled", "live"] } },
          { auctionStatus: { $exists: false } },
          { auctionStatus: null },
        ],
      });
    }

    // Dùng new RegExp để an toàn hơn
    if (keyword) {
      const searchRegex = new RegExp(keyword, "i");
      andFilters.push({
        $or: [
          { title: searchRegex },
          { "location.detail": searchRegex },
          { "location.province": searchRegex },
          { "location.ward": searchRegex },
        ],
      });
    }

    if (province) query["location.province"] = new RegExp(province, "i");
    if (property_type && property_type.length === 24)
      query.property_type = property_type;
    if (rental_type) query.rental_type = rental_type;
    if (bedroom) query.bedroom = { $gte: Number(bedroom) };
    if (bathroom) query.bathroom = { $gte: Number(bathroom) };

    if (minPrice || maxPrice) {
      query.$and = query.$and || [];
      const priceFilter = { $or: [] };
      const currentPrice = {};
      if (minPrice) currentPrice.$gte = Number(minPrice);
      if (maxPrice) currentPrice.$lte = Number(maxPrice);
      priceFilter.$or.push({ currentPrice });
      priceFilter.$or.push({ currentPrice: { $exists: false }, price: currentPrice });
      query.$and.push(priceFilter);
    }

    if (andFilters.length) {
      query.$and = query.$and ? [...query.$and, ...andFilters] : andFilters;
    }

    if (minArea || maxArea) {
      query.area = {};
      if (minArea) query.area.$gte = Number(minArea);
      if (maxArea) query.area.$lte = Number(maxArea);
    }

    // 1. Định nghĩa từ khóa map sang field database
    const sortMapping = {
      price_asc: { currentPrice: 1 },
      price_desc: { currentPrice: -1 },
      area_asc: { area: 1 },
      area_desc: { area: -1 },
      oldest: { createdAt: 1 },
      newest: { createdAt: -1 },
    };

    let sortOption = {};
    // if (sort === "price_asc") sortOption = { price: 1 };
    // if (sort === "price_desc") sortOption = { price: -1 };

    // // --- SỬA LỖI SORT AREA ---
    // if (sort === "area_asc") sortOption = { area: 1 }; // Trước đây bạn gán nhầm là price: 1
    // if (sort === "area_desc") sortOption = { area: -1 }; // Trước đây bạn gán nhầm là price: -1

    // if (sort === "oldest") sortOption = { createdAt: 1 };
    // if (sort === "newest") sortOption = { createdAt: -1 };

    if (sort) {
      // 2. Tách chuỗi sort bằng dấu phẩy (nếu client gửi dạng price_asc,oldest)
      // Nếu client gửi ?sort=price_asc&sort=oldest (array) thì Express tự xử lý thành array, ta chuẩn hóa về mảng.
      const sortParams = Array.isArray(sort) ? sort : sort.split(",");

      // 3. Duyệt qua từng yêu cầu sort và gộp vào object sortOption
      sortParams.forEach((item) => {
        const key = item.trim(); // Xóa khoảng trắng thừa
        if (sortMapping[key]) {
          // Object.assign giúp gộp object: {price: 1} + {createdAt: 1} => {price: 1, createdAt: 1}
          Object.assign(sortOption, sortMapping[key]);
        }
      });
    }

    // 4. Nếu không có sort nào hợp lệ (hoặc không truyền), mặc định là mới nhất
    if (Object.keys(sortOption).length === 0) {
      sortOption = { createdAt: -1 };
    }

    // console.log("Final Sort Option:", sortOption);
    // Kết quả sẽ dạng: { price: 1, createdAt: 1 }

    const listings = await Listing.find(query)
      .sort(sortOption)
      .limit(20)
      .populate("property_type", "name")
      .populate("owner", "username avatar name email");

    const normalized = listings.map((l) => normalizeAuctionFields(l));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ success: false, message: "Search Error" });
  }
};

export const getListingBids = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const User = (await import("../models/user.model.js")).default;
    const viewer = await User.findById(userId).select("role");
    if (!viewer || viewer.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const bids = await Bid.find({ listing: id })
      .populate("bidder", "name avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ bids });
  } catch (error) {
    console.error("getListingBids error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMyBids = async (req, res) => {
  try {
    const userId = req.userId;
    const bids = await Bid.find({ bidder: userId })
      .populate("listing", "title currentPrice startTime endTime auctionStatus")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ bids });
  } catch (error) {
    console.error("getMyBids error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cancelAuction = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if ((listing.bidCount || 0) > 0) {
      return res.status(400).json({ message: "Cannot cancel after bids" });
    }

    listing.status = "cancelled";
    listing.auctionStatus = "ended";
    await listing.save();

    req.io?.to(`auction_${listing._id}`).emit("auction:ended", {
      listingId: listing._id,
      auctionStatus: listing.auctionStatus,
    });

    return res.json({ message: "Auction cancelled", listing });
  } catch (error) {
    console.error("cancelAuction error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const placeBid = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { amount, maxAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const bidAmount = Number(amount);
    const maxAmountNum = maxAmount !== undefined ? Number(maxAmount) : undefined;
    if (!bidAmount || Number.isNaN(bidAmount)) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.owner?.toString() === userId.toString()) {
      return res.status(400).json({ message: "Owner cannot bid on own listing" });
    }


    const now = new Date();
    const status = getAuctionStatusByTime(listing.startTime, listing.endTime);
    if (status === "ended") {
      listing.auctionStatus = "ended";
      await listing.save();
      return res.status(400).json({ message: "Auction has ended" });
    }

    if (status === "scheduled") {
      listing.auctionStatus = "scheduled";
    } else {
      listing.auctionStatus = "live";
    }

    const auctionType = listing.auctionType || "english";
    const increment = listing.bidIncrement || 0;
    const current = listing.currentPrice ?? listing.startingPrice ?? listing.price ?? 0;

    if (auctionType === "reverse") {
      const maxNext = current - increment;
      if (bidAmount > maxNext) {
        return res.status(400).json({ message: `Bid must be at most ${maxNext}` });
      }
      const bid = await Bid.create({
        listing: listing._id,
        bidder: userId,
        amount: bidAmount,
        maxAmount: maxAmountNum,
        isProxy: Boolean(maxAmountNum),
        depositAmount: listing.depositAmount || 0,
        depositStatus: "held",
      });
      listing.currentPrice = bidAmount;
      listing.bidCount = (listing.bidCount || 0) + 1;
      listing.highestBidder = userId;

      const timeLeft = listing.endTime ? listing.endTime.getTime() - now.getTime() : null;
      const windowMs = (listing.antiSnipingWindowSec || 0) * 1000;
      const extendMs = (listing.antiSnipingExtensionSec || 0) * 1000;
      if (timeLeft !== null && timeLeft <= windowMs && extendMs > 0) {
        listing.endTime = new Date(listing.endTime.getTime() + extendMs);
      }

      await listing.save();

      req.io?.to(`auction_${listing._id}`).emit("auction:bid", {
        listingId: listing._id,
        currentPrice: listing.currentPrice,
        bidCount: listing.bidCount,
        highestBidder: listing.highestBidder,
        endTime: listing.endTime,
        auctionStatus: listing.auctionStatus,
      });

      if (timeLeft !== null && timeLeft <= windowMs && extendMs > 0) {
        req.io?.to(`auction_${listing._id}`).emit("auction:extended", {
          listingId: listing._id,
          endTime: listing.endTime,
        });
      }

      return res.status(201).json({ message: "Bid placed", bid, listing });
    }

    // English auction with proxy bidding
    const minNext = current + increment;
    const bidderMax = maxAmountNum !== undefined ? maxAmountNum : bidAmount;
    if (bidderMax < minNext) {
      return res.status(400).json({ message: `Bid must be at least ${minNext}` });
    }

    const bid = await Bid.create({
      listing: listing._id,
      bidder: userId,
      amount: bidAmount,
      maxAmount: bidderMax,
      isProxy: bidderMax !== bidAmount,
      depositAmount: listing.depositAmount || 0,
      depositStatus: "held",
    });

    const topBids = await Bid.find({ listing: listing._id })
      .sort({ maxAmount: -1, amount: -1 })
      .limit(2);

    const top = topBids[0];
    const second = topBids[1];
    const topMax = top?.maxAmount ?? top?.amount ?? 0;
    const secondMax = second?.maxAmount ?? second?.amount ?? 0;

    const nextPrice = second
      ? Math.min(topMax, secondMax + increment)
      : Math.max(minNext, Math.min(topMax, minNext));

    listing.currentPrice = nextPrice;
    listing.bidCount = (listing.bidCount || 0) + 1;
    listing.highestBidder = top?.bidder || userId;

    const timeLeft = listing.endTime ? listing.endTime.getTime() - now.getTime() : null;
    const windowMs = (listing.antiSnipingWindowSec || 0) * 1000;
    const extendMs = (listing.antiSnipingExtensionSec || 0) * 1000;
    if (timeLeft !== null && timeLeft <= windowMs && extendMs > 0) {
      listing.endTime = new Date(listing.endTime.getTime() + extendMs);
    }

    await listing.save();

    req.io?.to(`auction_${listing._id}`).emit("auction:bid", {
      listingId: listing._id,
      currentPrice: listing.currentPrice,
      bidCount: listing.bidCount,
      highestBidder: listing.highestBidder,
      endTime: listing.endTime,
      auctionStatus: listing.auctionStatus,
    });

    if (timeLeft !== null && timeLeft <= windowMs && extendMs > 0) {
      req.io?.to(`auction_${listing._id}`).emit("auction:extended", {
        listingId: listing._id,
        endTime: listing.endTime,
      });
    }

    return res.status(201).json({ message: "Bid placed", bid, listing });
  } catch (error) {
    console.error("placeBid error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateListingStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "closed", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // 🔒 Chỉ owner mới được sửa
    if (listing.owner.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🔒 Chỉ cho phép sửa khi đang approved hoặc closed
    if (!["approved", "closed", "rejected"].includes(listing.status)) {
      return res.status(400).json({
        message: "Cannot update status from current state",
      });
    }

    // 🔁 Toggle hợp lệ
    listing.status = status;
    await listing.save();

    return res.json({
      message: "Listing status updated",
      listing,
    });
  } catch (error) {
    console.error("updateListingStatus error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
