import ExcelJS, { Cell, Column, Row } from 'exceljs';
import { Request, Response } from 'express';
import { SalesModel } from '../Models/Sales';
import { SUCCESS_TYPES } from '../Types/Responses';
import dayjs from 'dayjs';
import "dayjs/locale/es";  // Asegúrate de importar el locale en español
dayjs.locale("es"); 
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

export const getProductsWithLowStock = async (req: Request, res: Response) => {
    try {
        // Obtener productos con stock <= 5
        const findProduct = await ProductsModel.find({ stock: { $lte: 2 } });

        // Si se encontraron productos, devolverlos en la respuesta
        return res.status(200).json({
            message: "Productos con stock bajo encontrados",
            data: findProduct,
        });

    } catch (err: any) {
        // Manejo de errores
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code,
        });
    }
}

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
                    code: product?.code,
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
}

export const generateSalesReportExcel = async (req: Request, res: Response) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Reporte de Ventas");

        // Encabezado general
        const titleRow = worksheet.addRow(["Reporte de Ventas - Artemisa"]);
        titleRow.font = { name: "Arial", size: 16, bold: true };
        titleRow.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.mergeCells(`A1:D1`);
        worksheet.addRow([]);

        // Obtener datos para ventas anuales, mensuales y del mes anterior
        const currentYear = dayjs().year();
        const currentMonth = dayjs().month() + 1;
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = lastMonth === 12 ? currentYear - 1 : currentYear;

        // Obtener los nombres de los meses en español
        const currentMonthName = dayjs().month(currentMonth - 1).format("MMMM");
        const lastMonthName = dayjs().month(lastMonth - 1).format("MMMM");

        // Ventas anuales (total para el año actual)
        const totalAnnualSales = await SalesModel.aggregate([
            { $match: { $expr: { $eq: [{ $year: "$created" }, currentYear] } } },
            { $group: { _id: null, totalPrice: { $sum: "$totalPrice" }, totalSales: { $sum: 1 } } },
        ]);
        const annualSalesAmount = totalAnnualSales[0]?.totalPrice || 0;
        const annualSalesCount = totalAnnualSales[0]?.totalSales || 0;

        // Ventas mensuales (total para el mes actual)
        const totalMonthlySales = await SalesModel.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$created" }, currentYear] },
                            { $eq: [{ $month: "$created" }, currentMonth] },
                        ],
                    },
                },
            },
            { $group: { _id: null, totalPrice: { $sum: "$totalPrice" }, totalSales: { $sum: 1 } } },
        ]);
        const monthlySalesAmount = totalMonthlySales[0]?.totalPrice || 0;
        const monthlySalesCount = totalMonthlySales[0]?.totalSales || 0;

        // Ventas del mes anterior
        const totalLastMonthSales = await SalesModel.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $year: "$created" }, lastMonthYear] },
                            { $eq: [{ $month: "$created" }, lastMonth] },
                        ],
                    },
                },
            },
            { $group: { _id: null, totalPrice: { $sum: "$totalPrice" }, totalSales: { $sum: 1 } } },
        ]);
        const lastMonthSalesAmount = totalLastMonthSales[0]?.totalPrice || 0;
        const lastMonthSalesCount = totalLastMonthSales[0]?.totalSales || 0;

        // Agregar resumen de ventas al Excel
        worksheet.addRow(["Resumen de Ventas"]).font = { bold: true, size: 14 };
        worksheet.addRow([`Ventas Anuales (${currentYear})`, annualSalesCount, annualSalesAmount])
            .getCell(3).numFmt = '"$"#,##0.00';
        worksheet.addRow([`Ventas del Mes Anterior (${lastMonthName})`, lastMonthSalesCount, lastMonthSalesAmount])
            .getCell(3).numFmt = '"$"#,##0.00';
        worksheet.addRow([`Ventas Mensuales (${currentMonthName})`, monthlySalesCount, monthlySalesAmount])
            .getCell(3).numFmt = '"$"#,##0.00';
        worksheet.addRow([]);

        // Obtener y agregar productos y estadísticas de stock
        const products = await ProductsModel.find({});
        const totalProducts = products.length;

        const lowStockProducts = products.filter(product => product.stock < 5).length;
        const mediumStockProducts = products.filter(product => product.stock >= 5 && product.stock < 8).length;
        const highStockProducts = products.filter(product => product.stock >= 9).length;

        worksheet.addRow(["Estadísticas de Productos"]).font = { bold: true, size: 14 };
        worksheet.addRow(["Total de Productos", totalProducts]);

        const stockHeader = worksheet.addRow(["Stock Bajo (<5)", "Stock Medio (5-8)", "Stock Alto (≥9)"]);
        stockHeader.font = { bold: true };

        const stockDataRow = worksheet.addRow([lowStockProducts, mediumStockProducts, highStockProducts]);
        stockDataRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0000" } }; // Rojo
        stockDataRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA500" } }; // Naranja
        stockDataRow.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "00FF00" } }; // Verde

        worksheet.addRow([]);

        // Agregar ventas por categoría
        const salesByCategory = await SalesModel.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.category",
                    totalQuantity: { $sum: "$products.quantity" },
                    totalPrice: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
                },
            },
            { $sort: { totalQuantity: -1 } },
        ]);

        worksheet.addRow(["Ventas por Categoría"]).font = { bold: true, size: 14 };
        worksheet.addRow(["Categoría", "Cantidad Total", "Monto Total"]).font = { bold: true };
        salesByCategory.forEach((category) => {
            const row = worksheet.addRow([category._id, category.totalQuantity, category.totalPrice]);
            row.getCell(3).numFmt = '"$"#,##0.00';
        });
        worksheet.addRow([]);

        // Obtener y agregar ventas por método de pago
        const salesByPaymentMethod = await SalesModel.aggregate([
            { $unwind: "$payType" },
            {
                $group: {
                    _id: "$payType",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        worksheet.addRow(["Ventas por Método de Pago"]).font = { bold: true, size: 14 };
        worksheet.addRow(["Método de Pago", "Total Ventas"]).font = { bold: true };
        salesByPaymentMethod.forEach((method) => {
            worksheet.addRow([method._id, method.count]);
        });

        // Ajustar anchos de columnas para mayor legibilidad
        worksheet.getColumn(1).width = 30;  // Aumentar el ancho de la columna A
        worksheet.getColumn(2).width = 20;
        worksheet.getColumn(3).width = 20;

        // Aplicar bordes y estilos a cada celda de la hoja
        worksheet.eachRow({ includeEmpty: false }, (row: Row) => {
            row.eachCell((cell: Cell) => {
                cell.font = { name: "Arial", size: 12 };
                cell.alignment = { vertical: "middle", horizontal: "center" };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        });

        // Configurar el archivo para descarga
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=Reporte-Ventas-Artemisa.xlsx");

        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        console.error("Error al generar el archivo Excel:", error);
        res.status(500).json({ message: "Error al generar el archivo Excel" });
    }
};