import { Document } from "mongoose";
import { IProductCategory, PayType, Picture } from "./Types";

export interface IProduct extends Document {
    name: string
    category: IProductCategory,
    price: number,
    stock: number,
    picture: Picture,
    created: Date
}

export interface IProductSale extends IProduct{
    quantity: number,
}


export interface ISales extends Document {
    moneyReturned?: number
    consecutive?: number
    idClient?: string,
    totalPrice: number,
    created: Date,
    payType: PayType,
    products: IProductSale[]
}

export interface IClient extends Document {
    name: string,
    lastName: string,
    phone?: number,
    email?: string
}

export interface Admin extends Document {
    name: string,
    email: string,
    password: string,
    role: string
}