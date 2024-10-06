const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/errorHandler')
const authRoutes = require('./routes/authRoutes')
const blogRoutes = require('./routes/blogRoutes')
const cookieParser = require('cookie-parser')
const verifyToken = require('./middleware/verifyToken')
require('dotenv').config()
const { initializeRedisClient, redisCachingMiddleware, redisClient } = require('./helpers/redis');

const app = express()

//Connect to MongoDB 
connectDB();

//Initialize redis
initializeRedisClient().then(() => {
    console.log('Redis initialized');
}).catch(err => {
    console.log('Error initializing Redis', err)
}) 

//Middleware setup
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(errorHandler)

app.get('/api', redisCachingMiddleware(), (req, res) => {
    res.json({ status: 'API is running' });
});

//Routes
app.use('/api', authRoutes)
app.use('/api/blog', verifyToken, blogRoutes)

const PORT = process.env.PORT || 4000




app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}!`)
})

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close()
        if (redisClient && redisClient.isOpen) {
            await redisClient.quit()
        }
        process.exit(0)
    } catch (error) {
        console.error('Error during shutdown:', err)
        process.exit
    }
})

