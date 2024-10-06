const mongoose = require('mongoose')
const User = require('./models/user')
const Blog = require('./models/blog')
const connectDB = require('./config/db')

//connect to MongoDB
connectDB()

async function testModels(){
    try {
        //creating a new user
        const newUser = new User({
         firstName: 'wiz',
         lastName: 'kid',
         username: 'Wizzy',
         email: 'starboy@gmail.com',
         password: 'pass1234'
        })
        await newUser.save()
        console.log('User saved:', newUser)

        //creating a new Blog with the user as the author

        const newBlog = new Blog({
            title: 'My First Blog',
            description: 'This is a first Test for description',
            author: newUser._id, //stores the User's objectId
            tags: ['test', 'blog'],
            state: 'draft',
            reading_time: '5 min',
            body: 'This is the body of my first Test'
        })

        await newBlog.save()
        console.log('Blog saved:', newBlog)

        //Retrieving the blog and populating the author field
        const blog = await Blog.findOne({ title: 'My First Blog' }).populate('author')
        console.log('Retrieved blog with author details:', newBlog)
        console.log('Author first name: ', blog.author.firstName) //output should be wiz

        
    } catch (error) {
        console.error('Error occurred:', error)
    }finally {
        // Close the connection
        mongoose.connection.close(); 
    }
}

testModels()