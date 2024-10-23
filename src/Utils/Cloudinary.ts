import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { API_KEY_CLOUDINARY, API_SECRET_CLOUDINARY, CLOUD_NAME } from "../Config/env";

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY_CLOUDINARY,
    api_secret: API_SECRET_CLOUDINARY
})

/**
 * @param image - Objeto file que retorna Express por medio de su propiedad .file
 * @returns Retorna el resultado de la subida de cloudinary
 */
export const uploadCloudinaryImage = async (image: { buffer: Buffer, mimetype: string }): Promise<UploadApiResponse> => {
    try {
        const base64Image = image.buffer.toString("base64");
        const result = await cloudinary.uploader.upload(
            `data:${image.mimetype};base64,${base64Image}`,
            {
                transformation: [
                    { width: 305, height: 160, crop: "fit" },
                    { quality: 80 },
                    { fetch_format: "webp" },
                ],
            }
        );
        return result;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        throw new Error("Image upload failed");
    }
};

export const deleteCloudinarImage = async ({public_id}: {public_id: string}) => {
    if(!public_id) return {ok: false, message: "No public_id defined"}

    try {
        await cloudinary.uploader.destroy(public_id)
        return {ok: true, message: "deleted"}
    } catch (error) {
        return {ok: false, message: "No deleted"}
    }
}