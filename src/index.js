import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import authRouter from './routers/auth.router.js'
import boardRouter from './routers/board.router.js'
import listRouter from './routers/list.router.js'
import cardRouter from './routers/card.router.js'
import labelRouter from './routers/label.router.js'
import commentRouter from './routers/comment.router.js'
import searchRouter from './routers/search.router.js'

dotenv.config()


const app = express()

app.use(express.json())

app.use((req, res, next) => {
  next()
})


app.use(cors());

app.use("/api", authRouter)
app.use("/api", boardRouter)
app.use("/api", listRouter)
app.use("/api", cardRouter)
app.use("/api", labelRouter)
app.use("/api", commentRouter)
app.use("/api", searchRouter)






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
