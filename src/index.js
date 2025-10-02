import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import authRouter from './routers/auth.router.js'

dotenv.config()


const app = express()

app.use(express.json())

app.use((req, res, next) => {
  next()
})


app.use(cors());

app.use("/api", authRouter)






//  Kết nối DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Kết nối MongoDB thành công')
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Lỗi MongoDB:', err)
  })
