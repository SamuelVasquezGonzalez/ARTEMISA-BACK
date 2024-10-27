import { AdminModel } from "../Models/Admin";
import { ResponseErrors } from "../Types/Extends";
import { Admin } from "../Types/Interfaces";
import { ERROR_TYPES, SUCCESS_TYPES } from "../Types/Responses";
import bcrypt from 'bcrypt'
export class Admins {
    data?: Admin;
    _id?: string;

    constructor (data?: Admin, _id?: string){
        this.data = data;
        this._id = _id
    }


    async login({email, password}: {email: string, password: string}) {
        try {
            const verifyUser = await AdminModel.findOne({email}).lean()

            if(verifyUser){

                const verifyPassword = await bcrypt.compare(password, verifyUser.password)
                if(verifyPassword){
                    return {
                        _id: verifyUser._id,
                        role: "Admin",
                    }
                }else{
                    throw new ResponseErrors("Contraseña incorrecta", 401)
                }
                
            }else{
                throw new ResponseErrors("Esta cuenta no existe", 401)
            }
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }

    async getAdmins () {
        try {
            const findAdmins = await AdminModel.find().lean()

            if(findAdmins.length === 0) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            return findAdmins
            
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async getAdminById (_id: string) {
        try {
            const findAdmin = await AdminModel.findById(_id).lean()

            if(!findAdmin) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            return findAdmin
            
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }
    
    async createAdmin (data: Admin) {
        try {

            await this.verifyEmail(data.email)

            const hashedPassword = await bcrypt.hash(data.password, 10)

            const newAdmin: Admin = new AdminModel({
                ...data,
                password: hashedPassword
            })

            await newAdmin.save()
            return {ok: true, message: SUCCESS_TYPES.CREATED}
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }

    async updateAdmin (_id: string, data: Admin) {
        try {

            const findAdmin = await AdminModel.findById(_id).lean()
            await this.verifyEmail(data.email, _id)

            let hashedPassword: string | null = null
            if(data.password){
                hashedPassword = await bcrypt.hash(data.password, 10)
            }

            const newInfo: Partial<Admin> = {
                name: data.name || findAdmin?.name,
                email: data.email || findAdmin?.email,
                password: hashedPassword || findAdmin?.password,
            }

            await AdminModel.findByIdAndUpdate(_id, {newInfo})

            return {ok: true, message: SUCCESS_TYPES.UPDATED}
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }


    async deleteAdmin (_id: string) {
        try {
            const verifyProduct = await AdminModel.findById(_id).lean()
            
            if(!verifyProduct) throw new ResponseErrors(ERROR_TYPES.NOT_FOUND, 404)

            await AdminModel.findByIdAndDelete(_id)
        } catch (err: any) {
            throw err instanceof Error ? err : new Error(err.message || "Error desconocido");
        }
    }


    async verifyEmail (email: string, _id?: string){
        const findAdmin = await AdminModel.findOne({email}).select("email").lean()

        if(!_id && findAdmin) throw new ResponseErrors(ERROR_TYPES.IN_USE, 409)
        if(findAdmin && findAdmin._id !== _id) throw new ResponseErrors(ERROR_TYPES.IN_USE, 409)
    }
}

export const AdminsCR = new Admins()