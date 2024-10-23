import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../Config/env";
import { Auth } from "../Types/Extends";
import { ERROR_TYPES } from "../Types/Responses";

const TOKEN_SECRET = JWT_SECRET as string;

export const AdminAuth = (req: Auth, res: Response, next: NextFunction): void => {
    const token = req.headers["authorization"] as string;

    if (!token) {
        // Retorna una respuesta si no hay token y termina la ejecución
        res.status(401).json({ error: { message: ERROR_TYPES.UNAUTHORIZED } });
        return;
    }

    jwt.verify(token, TOKEN_SECRET, (err, decoded: any) => {
        if (err) {
            // Si el token no es válido, devuelve un error 401
            res.status(401).json({ error: { message: ERROR_TYPES.UNAUTHORIZED } });
            return;
        }

        const decodedToken = decoded as Auth;
        req._id = decodedToken._id;
        req.role = decodedToken.role;

        if (req.role !== "Admin") {
            // Si el rol no es Admin, retorna error 403 y termina
            res.status(403).json({ error: { message: ERROR_TYPES.FORBIDDEN } });
            return;
        }

        // Si todo es correcto, continúa con la siguiente función
        next();
    });
};
