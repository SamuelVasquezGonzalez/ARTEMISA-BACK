import { Request, Response } from "express";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import { Admin } from "../Types/Interfaces";
import { AdminsCR } from "../Utils/Admins.class";
import { JWT_SECRET } from "../Config/env";
import jwt from 'jsonwebtoken'

const SECRET = JWT_SECRET as string


export const login = async (req: Request, res: Response) => {
    try {
        const {email, password}: {email: string, password: string} = req.body

        const login = await AdminsCR.login({email, password})
        

        if(login._id && login.role){
            const data = {
                _id: login._id.toString(),
                role: login.role,
            }

            const token = jwt.sign(data, SECRET, {
                expiresIn: "30 days"
            })
            
            res.json({message: SUCCESS_TYPES.GETTED,hola: "hola", accessToken: token, _id: login._id, role: login.role})
        }
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}


export const getAdmins = async (req: Request, res: Response) => {
    try {
        const admins = await AdminsCR.getAdmins()

        if(admins.length === 0) return res.status(404).json({message: ERROR_TYPES.NOT_FOUND})

        res.json({message: SUCCESS_TYPES.GETTED, data: [...admins]})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const getAdminById = async (req: Request, res: Response) => {
    try {
        const {idAdmin} = req.params;
        const admin = await AdminsCR.getAdminById(idAdmin)

        if(!admin) return res.status(404).json({message: ERROR_TYPES.NOT_FOUND})

        res.json({message: SUCCESS_TYPES.GETTED, data: {...admin}})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const {adminData}: {adminData: Admin} = req.body;

        await AdminsCR.createAdmin(adminData)

        res.json({message: SUCCESS_TYPES.CREATED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const {idAdmin} = req.params;
        const {adminData}: {adminData: Admin} = req.body;

        await AdminsCR.updateAdmin(idAdmin, adminData)

        res.json({message: SUCCESS_TYPES.UPDATED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const {idAdmin} = req.params;

        await AdminsCR.deleteAdmin(idAdmin)

        res.json({message: SUCCESS_TYPES.DELETED})
    } catch (err: any) {
        return res.status(err.code || 500).json({
            message: err.message,
            code: err.code
        });
    }
}