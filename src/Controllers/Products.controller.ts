import { Request, Response } from "express";
import { ProductsCR } from "../Utils/Products.class";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { IProduct } from "../Types/Interfaces";
import { ProductsModel } from "../Models/Products";
import ExcelJS from "exceljs";

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
    const { category, searchTerm, code, page = 1, limit = 10 } = req.query;

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

        if(code !== 'null' && code !== 'NaN'){
          filterConditions.code = code
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


export const generateProductExcel = async (req: Request, res: Response) => {
  try {
    // Obtener todos los productos de la base de datos y ordenarlos por stock
    const products = await ProductsModel.find().sort({ stock: 1 });

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventario de Productos");

    const titleRow = worksheet.addRow(["Inventario de productos actuales - Artemisa"]);
    titleRow.font = { name: "Arial", size: 14, bold: true };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.mergeCells(`A1:F1`);
    worksheet.addRow([]);

    // Cálculos de estadísticas
    let totalEnMecanica = 0;
    let lowStockCount = 0;
    products.forEach((product) => {
      totalEnMecanica += product.price * product.stock;
      if (product.stock <= 5) lowStockCount += 1;
    });

    // Formateo del total en mecánica para ser más legible
    const totalEnMecanicaFormatted = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(totalEnMecanica);

    const statsRow1 = worksheet.addRow(["Total en Mercancia:", totalEnMecanicaFormatted]);
    const statsRow2 = worksheet.addRow(["Cantidad de productos:", products.length]);

    [statsRow1, statsRow2].forEach((row) => {
      row.font = { name: "Arial", size: 12, bold: true };
      row.alignment = { vertical: "middle", horizontal: "left" };
    });

    worksheet.addRow([]); // Espacio después de las estadísticas

    // Estilo de encabezados de columnas
    const headerRow = worksheet.getRow(8);
    headerRow.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF333399" },
    };
    headerRow.alignment = { horizontal: "center" };

    worksheet.columns = [
      { header: "Nombre", key: "name", width: 30, },
      { header: "Categoría", key: "category", width: 20 },
      { header: "Precio Venta", key: "price", width: 15 },
      { header: "Precio Compra", key: "buyPrice", width: 15 },
      { header: "Stock", key: "stock", width: 10 },
      { header: "Inventario de productos actuales - Artemisa", key: "code", width: 15 },
    ];

    const productsHeaders = worksheet.addRow(["Nombre", "Categoria", "Precio venta", "Precio compra", "En inventario", "Codigo"])

    productsHeaders.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.font = {bold: true}
    })

    // Agregar productos a la tabla
    products.forEach((product) => {
      const row = worksheet.addRow({
        ...product.toObject(),
        code: `#${product?.code?.toString().padStart(4, '0')}` // Formato de código con #
      });
      row.getCell("price").numFmt = "$#,##0.00";
      row.getCell("buyPrice").numFmt = "$#,##0.00";

      // Colores condicionales en stock
      if (product.stock < 6) {
        row.getCell("stock").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF0000" },
        };
      } else if (product.stock >= 6 && product.stock <= 8) {
        row.getCell("stock").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFA500" },
        };
      } else {
        row.getCell("stock").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF00FF00" },
        };
      }

      // Bordes de las celdas
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Configurar archivo para descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=Inventario-Artemisa.xlsx");

    // Escribir el archivo en el flujo de respuesta
    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error);
    res.status(500).json({ message: "Error al generar el archivo Excel" });
  }
};
