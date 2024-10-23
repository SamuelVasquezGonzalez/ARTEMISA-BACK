import { Router } from "express";
import { AdminAuth } from "../Auth/Admin.auth";
import { upload } from "../Middleware/Uploads";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../Controllers/Products.controller";


const router: Router = Router()

router.get("/v1/products", AdminAuth, getProducts)
router.get("/v1/product/:idProduct", AdminAuth, getProductById)

router.post("/v1/product", AdminAuth, upload.single("image"), createProduct)
router.put("/v1/product/:idProduct", AdminAuth, upload.single("image"), updateProduct)
router.delete("/v1/product/:idProduct", AdminAuth, deleteProduct)

export default router;