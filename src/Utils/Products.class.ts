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


    async getProducts(skip: number = 0, limit: number = 10, category?: string, searchTerm?: string, code?: number) {
        try {
            const query: any = {};
    
            // Filtra por categoría si se pasa un valor
            if (category) {
                query.category = category;
            }
    
            // Filtra por nombre si se pasa un término de búsqueda
            if (searchTerm) {
                query.name = { $regex: searchTerm, $options: 'i' }; // Insensitive a mayúsculas y minúsculas
            }
    
            if(code){
                query.code = code
            }
            // Obtén los productos con los filtros aplicados
            const findProducts = await ProductsModel.find(query)
                .skip(skip)
                .limit(limit)
                .lean();
    
            if (findProducts.length === 0) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404);
    
            return findProducts;
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }

    async countFilteredProducts(category?: string, searchTerm?: string) {
        try {
            const query: any = {};
    
            if (category) {
                query.category = category;
            }
    
            if (searchTerm) {
                query.name = { $regex: searchTerm, $options: 'i' };
            }
    
            return await ProductsModel.countDocuments(query);
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    

    async countProducts() {
        try {
            return await ProductsModel.countDocuments(); // Retorna el conteo total de productos
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
    
    async createProduct(data: IProduct, file?: { buffer: Buffer, mimetype: string }) {
        try {
    
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
    
            let image: Picture | undefined;
    
            if (file) {
                const uploadResult = await uploadCloudinaryImage(file);
                image = {
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id,
                };
            }  
    
            // Obtener el último producto ordenado por el código en orden descendente
            const getLastProduct = await ProductsModel.findOne().sort({ code: -1 });
    
            // Si se encontró el último producto, incrementar su código en 1
            const newCode: number = getLastProduct && getLastProduct.code ? getLastProduct?.code + 1 : 1000;  // Si no hay productos, iniciar con 1
    
            // Crear el nuevo producto con el nuevo código
            const newProduct: IProduct = new ProductsModel({
                ...data,
                created: new Date(),
                picture: image || DEFAULT_PIC,
                code: newCode
            });
    
            await newProduct.save();
            return { ok: true, message: SUCCESS_TYPES.CREATED };
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
                buyPrice: data.buyPrice || verifyProduct?.buyPrice,
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