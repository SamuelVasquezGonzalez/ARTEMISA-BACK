import { ProductsModel } from "../Models/Products";
import { ResponseErrors } from "../Types/Extends";
import { IProduct } from "../Types/Interfaces";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { Picture } from "../Types/Types";
import { deleteCloudinarImage, uploadCloudinaryImage } from "./Cloudinary";

const DEFAULT_PIC = {
    url: "https://res.cloudinary.com/appsftw/image/upload/v1725911983/mayw65ww5edphgs4rfng.jpg",
    public_id: "",
}

export class Products {
    data?: IProduct;
    _id?: string;

    constructor (data?: IProduct, _id?: string){
        this.data = data;
        this._id = _id
    }


    async getProducts () {
        try {
            const findProducts = await ProductsModel.find().lean()

            if(findProducts.length === 0) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            return findProducts
            
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async getProductById (_id: string) {
        try {
            const findProduct = await ProductsModel.findById(_id).lean()

            if(!findProduct) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            return findProduct
            
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async createProduct (data: IProduct, file?: { buffer: Buffer, mimetype: string }) {
        try {

            if(typeof data === "string"){
                data = JSON.parse(data)
            }

            let image: Picture | undefined;

            if (file) {
                const uploadResult = await uploadCloudinaryImage(file);
                image = {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                };
            }  


            const newProduct: IProduct = new ProductsModel({
                ...data,
                created: new Date(),
                picture: image || DEFAULT_PIC
            })

            await newProduct.save()
            return {ok: true, message: SUCCESS_TYPES.CREATED}
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }

    async updateProduct (_id: string, data: IProduct, file?: { buffer: Buffer, mimetype: string }) {
        try {

            if(typeof data === "string"){
                data = JSON.parse(data)
            }
            
            const verifyProduct = await ProductsModel.findById(_id).lean()
            if(!verifyProduct) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)
            let image: Picture | undefined;

            if (file) {
                const uploadResult = await uploadCloudinaryImage(file);
                image = {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                };

                if(verifyProduct && verifyProduct.picture.public_id){
                    await deleteCloudinarImage({public_id: verifyProduct.picture.public_id})
                }
            }  


            const newInfo: Partial<IProduct> = {
                name: data.name || verifyProduct?.name,
                price: data.price || verifyProduct?.price,
                category: data.category || verifyProduct?.category,
                stock: data.stock,
                picture: image || verifyProduct.picture || DEFAULT_PIC
            }

            await ProductsModel.findByIdAndUpdate(_id, newInfo, {new: true})
            return {ok: true, message: SUCCESS_TYPES.UPDATED}
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }


    async deleteProduct (_id: string) {
        try {
            const verifyProduct = await ProductsModel.findById(_id).lean()
            
            if(!verifyProduct) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            if(verifyProduct.picture.public_id){
                await deleteCloudinarImage({public_id: verifyProduct.picture.public_id})
            }

            await ProductsModel.findByIdAndDelete(_id)
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
}

export const ProductsCR = new Products()