import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/user.model.js";
import Listing from "../models/listing.model.js";
import Bid from "../models/bid.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seed = async () => {
  await connectDB();

  try {
    // Create demo users: some over last 7 days
    const demoUsers = [];
    for (let i = 0; i < 20; i++) {
      const username = `demouser${i}`;
      let u = await User.findOne({ username });
      if (!u) {
        const hashed = await bcrypt.hash("Password1!", 10);
        u = await User.create({ username, password: hashed, name: `Demo User ${i}`, phone: "0000000000", role: "guest", createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 3600 * 1000) });
      }
      demoUsers.push(u);
    }

    // Create demo listings (auctions)
    const statuses = ["approved", "pending", "closed"];
    for (let i = 0; i < 40; i++) {
      const title = `Demo Listing ${i}`;
      let l = await Listing.findOne({ title });
      if (!l) {
        const owner = demoUsers[i % demoUsers.length];
        const status = statuses[i % statuses.length];
        const now = Date.now();
        const startTime = new Date(now - (i % 3) * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
        const startingPrice = 500000000 + i * 1000000;
        const bidIncrement = 1000000;
        const currentPrice = startingPrice + (i % 5) * bidIncrement;
        const auctionStatus = endTime <= new Date() ? "ended" : startTime <= new Date() ? "live" : "scheduled";
        await Listing.create({
          title,
          description: "Demo listing",
          area: 50 + i,
          price: startingPrice,
          startingPrice,
          currentPrice,
          bidIncrement,
          startTime,
          endTime,
          auctionStatus,
          bidCount: i % 5,
          status,
          rental_type: "rent",
          owner: owner._id,
          property_type: null,
          location: { province: "Demo Province", ward: "Ward", detail: "Demo Address", coords: { type: "Point", coordinates: [105.8 + i * 0.001, 21.0 + i * 0.001] } },
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 3600 * 1000)
        });
      }
    }

    // Seed demo bids for live/ended auctions
    const auctionListings = await Listing.find({ auctionStatus: { $in: ["live", "ended"] } }).limit(10);
    for (const listing of auctionListings) {
      const base = listing.startingPrice || listing.price || 0;
      for (let b = 0; b < 3; b++) {
        const bidder = demoUsers[(b + 3) % demoUsers.length];
        await Bid.create({
          listing: listing._id,
          bidder: bidder._id,
          amount: base + (b + 1) * (listing.bidIncrement || 1000000),
        });
      }
    }

    console.log("Demo data seeded");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
