import { Router } from "express";
import { AdminAuth } from "../Auth/Admin.auth";
import { createSale, deleteAllSales, deleteSale, getAllSales, getLastSale } from "../Controllers/Sales.controller";

const router: Router = Router()

router.get("/v1/sales/all", AdminAuth, getAllSales)
router.post("/v1/sales", AdminAuth, createSale)
router.get("/v1/sales/last", AdminAuth, getLastSale)
router.delete("/v1/sale/:idSale", AdminAuth, deleteSale)
router.delete("/v1/sales", AdminAuth, deleteAllSales)


export default router;