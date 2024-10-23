import mongoose from "mongoose";
import { URI_MONGO } from "./env";

const db = mongoose.connection;

export const conectarDb = async (): Promise<void> => {
    try {
        const mongoUri = URI_MONGO
        if(!mongoUri) {
            console.log(`The environment variable is not defined`)
            process.exit(1)
        }

        mongoose.connect(mongoUri, {dbName: "artemisa"})
            .catch((err) => {
                throw new Error(`I didn't connect to the db, check your credentials, ${err}`)
            });

        db.on("open", () => {
            console.log("The database has been connected")
        });

    } catch (err) {
        console.log(`There was an error with the database: ${err}`)
    }
}

conectarDb()