import {Schema, model} from 'mongoose'
import { IProduct } from '../Types/Interfaces'


const ProductsSchema: Schema = new Schema ({
    name: {type: String, require: true},
    category: {type: [String], default: "Maquillaje"},
    price: {type: Number, require: true, default: 0},
    buyPrice: {type: Number, default: 0},
    stock: {type: Number, require: true, default: 0},
    picture: {
        public_id: {type: String, default: ""},
        url: {type: String, default: "https://res.cloudinary.com/appsftw/image/upload/v1725911983/mayw65ww5edphgs4rfng.jpg"}
    },
    created: {type: Date, default: new Date()}
})

export const ProductsModel = model<IProduct>("product", ProductsSchema)