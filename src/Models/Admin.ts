import {Schema, model} from 'mongoose'
import { Admin } from '../Types/Interfaces'

const AdminSchema: Schema = new Schema ({
    name: {type: String, require: true, default: ""},
    email: {type: String, unique: true, require: true, default: ""},
    password: {type: String, require: true, default: ""},
    role: {type: String, default: "Admin"}
})

export const AdminModel = model<Admin>("admin", AdminSchema)