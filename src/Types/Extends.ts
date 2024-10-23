import { Request } from "express";

export interface Auth extends Request {
    _id?: string,
    role?: string,
}

export class ResponseErrors extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
        this.name = "ResponseErrors"; 
    }
}
