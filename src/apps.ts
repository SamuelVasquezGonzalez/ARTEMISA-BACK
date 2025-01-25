
import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";

import AdminsRoutes from './Routes/Admin.routes'
import ProductsRoutes from './Routes/Products.routes'
import SalesRoutes from './Routes/Sales.routes'
import StatsRoutes from './Routes/Stats.routes'


export const app = express();


const corsOptions: CorsOptions = {
    origin: ["http://localhost:5173", "http://localhost:5174", "https://i-artemisa.netlify.app", "http://i-artemisa.netlify.app", "https://i-artemisa.netlify.app/", "http://i-artemisa.netlify.app/"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204
}

app.use(morgan("dev"))
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


app.get("/", (req: Request, res: Response) => {
    res.json({
        name: "Tomapedidos Backend",
        version: "1.0.0",
        access: "private",
        ok: true
    })
})


app.use(AdminsRoutes)
app.use(ProductsRoutes)
app.use(SalesRoutes)
app.use(StatsRoutes)



app.all("*", (req: Request, res: Response) => {
    res.status(404).json({ message: "This path doesn't exist" });
});