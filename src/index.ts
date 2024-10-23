import { app } from "./apps"
import './Config/DBconection'
import { PORT } from "./Config/env"

app.listen(PORT, (): any => {
    console.log(`The server is running in port ${PORT}`)
})