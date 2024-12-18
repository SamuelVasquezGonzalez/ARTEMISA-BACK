import { Router } from "express";
import { AdminAuth } from "../Auth/Admin.auth";
import { generateSalesReportExcel, getMonthlySales, getProductsWithLowStock, getSalesByCategory, getSalesByPaymentMethod, getTopProducts } from "../Controllers/Stats.controller";

const router: Router = Router()

router.get("/v1/stats/monthlysales", AdminAuth, getMonthlySales)
router.get("/v1/stats/category", AdminAuth, getSalesByCategory)
router.get("/v1/stats/payments", AdminAuth, getSalesByPaymentMethod)
router.get("/v1/stats/lowstock", AdminAuth, getProductsWithLowStock)
router.get("/v1/stats/top", AdminAuth, getTopProducts)

router.get("/v1/stats/all/download", generateSalesReportExcel)

export default router;