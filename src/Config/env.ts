import dotenv from "dotenv";
import path from "path";
dotenv.config()

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const {PORT, URI_MONGO, JWT_SECRET, DOMINIO, CLOUD_NAME, API_KEY_CLOUDINARY, API_SECRET_CLOUDINARY} = process.env