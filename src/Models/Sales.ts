import {Schema, model} from 'mongoose'
import { ISales } from '../Types/Interfaces'

const ProductSale: Schema = new Schema ({
    _id: {type: String, require: true, default: ""},
    name: {type: String, require: true, default: ""},
    category: {type: [String], default: "Maquillaje"},
    price: {type: Number, require: true, default: 0},
    stock: {type: Number, default: 0},
    picture: {
        public_id: {type: String, default: ""},
        url: {type: String, default: ""}
    },
    created: {type: Date, default: new Date()},
    quantity: {type: Number, default: 0},
})

const SalesSchema: Schema = new Schema({
    idClient: {type: String, default: ""},
    totalPrice: {type: Number, require: true, default: 0},
    created: {type: Date, default: new Date()},
    payType: {type: [String], default: "Efectivo"},
    products: {type: [ProductSale], default: []},
    moneyReturned: {type: Number, default: 0},
    consecutive: {type: Number, require: true, default: 1}
})


export const SalesModel = model<ISales>("sale", SalesSchema)