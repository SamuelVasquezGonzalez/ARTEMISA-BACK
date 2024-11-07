import { Request, Response } from "express";
import { ProductsCR } from "../Utils/Products.class";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { IProduct } from "../Types/Interfaces";
import { ProductsModel } from "../Models/Products";

export const getProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const products = await ProductsCR.getProducts(skip, limit);
        const totalProducts = await ProductsCR.countProducts();
        const totalPages = Math.ceil(totalProducts / limit);

        if (products.length === 0) {
            return res.status(404).json({
                message: ERROR_TYPES.NOT_FOUND,
            });
        }

        return res.json({
            message: SUCCESS_TYPES.GETTED,
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
            },
        });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message || "Error desconocido",
            code: err.code,
        });
    }
};


export const getFilteredProducts = async (req: Request, res: Response) => {
    const { category, searchTerm, page = 1, limit = 10 } = req.query;

    try {
        const skip = (Number(page) - 1) * Number(limit);
        

        // Filtro para la categoría
        const filterConditions: any = {};

        if (category) {
            filterConditions.category = category;
        }

        // Si searchTerm está presente, se convierte a string y se usa una expresión regular
        if (searchTerm) {
            // Convierte searchTerm a string si no lo es ya
            const searchQuery = String(searchTerm);

            // Utiliza la expresión regular para hacer la búsqueda en el nombre
            filterConditions.name = { $regex: new RegExp(searchQuery, "i") }; // "i" hace la búsqueda insensible a mayúsculas
        }

        const products = await ProductsModel.find(filterConditions)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const totalProducts = await ProductsModel.countDocuments(filterConditions);
        const totalPages = Math.ceil(totalProducts / Number(limit));

        res.json({
            data: products,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalProducts,
            }
        });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};


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

