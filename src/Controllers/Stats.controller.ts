import { Request, Response } from 'express';
import { SalesModel } from '../Models/Sales';
import { SUCCESS_TYPES } from '../Types/Responses';
import dayjs from 'dayjs';
import { ProductsModel } from '../Models/Products';

export const getMonthlySales = async (req: Request, res: Response) => {
    try {
        const currentMonth = dayjs().month() + 1;
        const previousMonth = dayjs().subtract(1, 'month').month() + 1;

        const salesByMonth = await SalesModel.aggregate([
            {
                $match: {
                    $expr: {
                        $or: [
                            { $eq: [{ $month: "$created" }, currentMonth] },
                            { $eq: [{ $month: "$created" }, previousMonth] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$created" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Renombrar los resultados para actualMonth y lastMonth
        const response = {
            lastMonth: salesByMonth.find(month => month._id === previousMonth)?.count || 0,
            actualMonth: salesByMonth.find(month => month._id === currentMonth)?.count || 0,
        };

        res.json({ message: "Correcto", data: response });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};


export const getSalesByCategory = async (req: Request, res: Response) => {
    try {
        const salesByCategory = await SalesModel.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.category",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        // Formatear respuesta para que solo contenga nombre de la categoría y cantidad total
        const response = salesByCategory.map(category => ({
            category: category._id,
            totalQuantity: category.totalQuantity,
        }));

        res.json({ message: "Correcto", data: response });
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};


export const getSalesByPaymentMethod = async (req: Request, res: Response) => {
    try {
        const salesByPaymentMethod = await SalesModel.aggregate([
            { $unwind: "$payType" },
            {
                $group: {
                    _id: "$payType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        res.json({message: SUCCESS_TYPES.GETTED, data: [...salesByPaymentMethod]});
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
};

export const getTopProducts = async (req: Request, res: Response) => {
    try {
        // Obtener todas las ventas
        const sales = await SalesModel.find().populate('products');

        // Crear un objeto para contar las ventas de cada producto
        const productCount: { [key: string]: { count: number } } = {};

        sales.forEach(sale => {
            sale.products.forEach((product: any) => {
                if (productCount[product._id]) {
                    productCount[product._id].count += 1;
                } else {
                    productCount[product._id] = {
                        count: 1,
                    };
                }
            });
        });

        // Convertir el objeto a un array y ordenar por count
        const sortedProducts = Object.entries(productCount).sort(([, a], [, b]) => b.count - a.count);

        // Tomar solo los 3 productos más vendidos y buscar sus detalles
        const topProducts = await Promise.all(
            sortedProducts.slice(0, 3).map(async ([_id, item]) => {
                const product = await ProductsModel.findById(_id);
                return {
                    _id: product?._id || "",
                    name: product?.name || "Desconocido",
                    category: product?.category || "Desconocido",
                    stock: product?.stock || 0,
                    buyPrice: product?.buyPrice || 0,
                    count: item.count,
                    price: product?.price || 0,
                    picture: product?.picture || {
                        public_id: "",
                        url: "https://res.cloudinary.com/appsftw/image/upload/v1725911983/mayw65ww5edphgs4rfng.jpg"
                    },
                };
            })
        );

        res.json({
            message: "Correcto",
            data: topProducts,
        });
    } catch (err: any) {
        console.error('Error fetching top products:', err);
        res.status(500).json({
            message: err.message,
            code: err.code || 500,
        });
    }
};