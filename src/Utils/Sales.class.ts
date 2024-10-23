import { ProductsModel } from "../Models/Products";
import { SalesModel } from "../Models/Sales";
import { ResponseErrors } from "../Types/Extends";
import { IProduct, ISales } from "../Types/Interfaces";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { Picture } from "../Types/Types";
import { deleteCloudinarImage, uploadCloudinaryImage } from "./Cloudinary";


export class Sales {
    data?: ISales;
    _id?: string;

    constructor (data?: ISales, _id?: string){
        this.data = data;
        this._id = _id
    }


    async getSales () {
        try {
            const getSales = await SalesModel.find().lean()

            if(getSales.length === 0) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            return getSales
            
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async createSale (data: ISales) {
        try {
            const findLastSale = await SalesModel.findOne()
            .select("consecutive")
            .sort({ consecutive: -1 })
            .lean()


            Promise.all(data.products.map(async (product) => {
                const getProductById = await ProductsModel.findById(product._id).lean()

                if(!getProductById) return new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

                await ProductsModel.findByIdAndUpdate(product._id, {stock: getProductById.stock - product.quantity})
            }))

            const newSale: ISales = new SalesModel({
                ...data,
                created: new Date(),
                consecutive: (findLastSale?.consecutive || 0) + 1
            })

            await newSale.save()
            return {ok: true, message: SUCCESS_TYPES.CREATED}
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }


    async deleteSale (_id: string) {
        try {
            const verifyProduct = await ProductsModel.findById(_id).lean()
            
            if(!verifyProduct) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            await SalesModel.findByIdAndDelete(_id)
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async deleteAllSales () {
        try {
            await SalesModel.deleteMany()
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
}

export const SalesCR = new Sales()