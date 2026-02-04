import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { URL } from "url";

dotenv.config({ path: new URL("../.env", import.meta.url) });

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;