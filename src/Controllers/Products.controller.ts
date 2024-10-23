import { Request, Response } from "express";
import { ProductsCR } from "../Utils/Products.class";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { IProduct } from "../Types/Interfaces";

export const getProducts = async (req: Request, res: Response) => {
    try {
        const products = await ProductsCR.getProducts()

        if(products.length === 0) return res.status(404).json({message: ERROR_TYPES.NOT_FOUND})

        res.json({message: SUCCESS_TYPES.GETTED, data: [...products]})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const getProductById = async (req: Request, res: Response) => {
    try {
        const {idProduct} = req.params;
        const product = await ProductsCR.getProductById(idProduct)

        if(!product) return res.status(404).json({message: ERROR_TYPES.NOT_FOUND})

        res.json({message: SUCCESS_TYPES.GETTED, data: {...product}})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const createProduct = async (req: Request, res: Response) => {
    try {
        const {productData}: {productData: IProduct} = req.body;

        await ProductsCR.createProduct(productData, req.file)

        res.json({message: SUCCESS_TYPES.CREATED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const {idProduct} = req.params;
        const {productData}: {productData: IProduct} = req.body;

        await ProductsCR.updateProduct(idProduct, productData, req.file)

        res.json({message: SUCCESS_TYPES.UPDATED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const {idProduct} = req.params;

        await ProductsCR.deleteProduct(idProduct)

        res.json({message: SUCCESS_TYPES.DELETED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}