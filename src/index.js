import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import { createServer } from 'http'
import authRouter from './routers/auth.router.js'
import boardRouter from './routers/board.router.js'
import listRouter from './routers/list.router.js'
import cardRouter from './routers/card.router.js'
import commentRouter from './routers/comment.router.js'
import checklistRouter from './routers/checklist.router.js'
import activityRouter from './routers/activity.router.js'
import setupSocketIO from './socket/socket.js'

dotenv.config()

const app = express()
const server = createServer(app)

app.use(express.json())

app.use((req, res, next) => {
  next()
})

app.use(cors());

app.use("/api", authRouter)
app.use("/api", boardRouter)
app.use("/api", listRouter)
app.use("/api", cardRouter)
app.use("/api", commentRouter)
app.use("/api", checklistRouter)
app.use("/api", activityRouter)

// Setup Socket.IO
const io = setupSocketIO(server)

// Make io available to routes
app.set('io', io)

//  Kết nối DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      console.log(`Server đang được chạy tại Cổng: ${PORT}`)
    })
  })
  .catch((err) => {
  })
