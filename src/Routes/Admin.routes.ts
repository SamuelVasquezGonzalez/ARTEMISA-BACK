import { Router } from "express";
import { AdminAuth } from "../Auth/Admin.auth";
import { createAdmin, deleteAdmin, getAdminById, getAdmins, login, updateAdmin } from "../Controllers/Admins.controller";
const router: Router = Router()


router.post("/v1/login", login)



router.get("/v1/admins", AdminAuth, getAdmins)
router.get("/v1/admin/:idAdmin", AdminAuth, getAdminById)

router.post("/v1/admins", AdminAuth, createAdmin)
router.put("/v1/admin/:idAdmin", AdminAuth, updateAdmin)
router.delete("/v1/admin/:idAdmin", AdminAuth, deleteAdmin)

export default router;