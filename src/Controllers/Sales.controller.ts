import { Request, Response } from "express";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { SalesCR } from "../Utils/Sales.class";
import { ISales } from "../Types/Interfaces";
import { SalesModel } from "../Models/Sales";

export const getAllSales = async (req: Request, res: Response) => {
    try {
        const allSales = await SalesCR.getSales();
        if (allSales.length === 0) return res.status(404).json({ message: ERROR_TYPES.NOT_FOUND });

        res.json({ message: SUCCESS_TYPES.GETTED, data: [...allSales] });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};

export const getLastSale = async (req: Request, res: Response) => {
    try {
        const lastSale = await SalesModel.findOne().select("consecutive").sort({ consecutive: -1 }).lean()

        res.json({ message: SUCCESS_TYPES.GETTED, data: {...lastSale} });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};

export const createSale = async (req: Request, res: Response) => {
    try {
        const {saleData}: {saleData: ISales} = req.body;
        
        await SalesCR.createSale(saleData)

        res.json({ message: SUCCESS_TYPES.CREATED });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};

export const deleteSale = async (req: Request, res: Response) => {
    try {
        const {idSale} = req.params;
        
        await SalesCR.deleteSale(idSale)

        res.json({ message: SUCCESS_TYPES.DELETED });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};

export const deleteAllSales = async (req: Request, res: Response) => {
    try {
        await SalesCR.deleteAllSales()

        res.json({ message: SUCCESS_TYPES.DELETED });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};
