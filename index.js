const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const userModel = require('./models/User')
const jobModel = require('./models/Jobs')
const commentModel = require('./models/Comments')
const auth = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const passport = require('passport')
require('./config/passport')

const app = express()
app.use(cors({origin: process.env.CLIENT_URL,
    credentials: true}))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

//connecting to DB

mongoose.connect(process.env.MONGO_URI).
    then(() => console.log('Connected to DB')
    ).catch((err) => console.log(err)
    )

const generateToken = (id) => {
    return jwt.sign({id} , process.env.JWT_SECRET , {expiresIn : '1h'}
    )
}

app.set("trust proxy", 1) // lol no idea .. smtg cookie related

//establishing the routes

app.get('/' , (req , res) => {
    res.send('HI bro whats good')
})

app.get('/profile' , auth , async (req , res) => {
    const userInfo = await userModel.findById(req.userId).select("username email")
    
    if(!userInfo) return res.json({msg : "User not found"})
    res.json({userInfo})
})

app.post('/postajob' , auth , async (req, res) => {
    const {jobTitle , jobDesc , cost , tags, email, username} = req.body
    const newJob = new jobModel({
        jobTitle ,
        jobDescription : jobDesc,
        cost,
        tags,
        email,
        username,
    })
    await newJob.save()
    res.json({msg : "Job Created"})
})

app.get('/apply' , auth , async (req , res) => {
    const userEmail = await userModel.findById(req.userId).select("email")
    const data = await jobModel.find({
        email : {$ne : userEmail.email}
    }).sort({createdAt : -1})
    res.json({data})
})

app.get('/jobs/:item' , auth , async  (req , res) => {
    const jobId = req.params.item
    const jobData = await jobModel.findById(jobId)
    res.json({jobData})
})

app.get('/jobsbyuser' , auth , async (req, res) => {
    const userId = await userModel.findById(req.userId).select("email")
    const posts = await jobModel.find({email : userId.email}).sort({createdAt : -1})
    res.json({posts})
})

app.get('/google' , passport.authenticate("google" , {scope : ["profile" , "email"]}))

app.get('/google/callback' , passport.authenticate("google" , {session : false}) , (req, res) => {
    const token = generateToken(req.user)

    res.cookie("token" , token , {
        httpOnly: true ,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 60*60*1000,
    })

    res.redirect("http://localhost:3000/")
} )

app.post('/signup' , async (req, res) => {
    try{
        const {username , email , password} = req.body

        const isExistingUser = await userModel.findOne({email})
        if(isExistingUser){
            return res.json({msg : "User already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password , salt)

        const newUser = new userModel({
            username , 
            email ,
            password : hashedPassword
        })
        
        await newUser.save()

        res.json({msg : "User created"})

    } catch (err){
        console.log(err);
    }
    
    
    res.json({success : true})
})

app.post('/login' , async (req , res) => {

    try{
        const {email , password} = req.body
        const user = await userModel.findOne({email})

        if(!user){
            return res.json({msg : "Invalid Email"})
        }

        const isValidPassword = await bcrypt.compare(password , user.password)
        if(!isValidPassword){
            return res.json({msg : "Invalid Password"})
        }

        const newToken = generateToken(user._id)

        res.cookie("token" , newToken , {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // https only in prod
            sameSite: "strict", // or "lax"
            maxAge: 60*60*1000 // 1hr 
        } )
        .json({
            user : {
                id : user._id,
                username: user.username,
                email: user.email
            }
        })

    }catch(err){
        res.json({error : err})
    }
    
})

app.post('/logout' , (req, res) => {
    res.clearCookie("token" , {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    }).json({msg : "logout success"})
})

app.post('/addcomment' , auth , async (req, res) => {
    const {comment , username , postId} = req.body
    const newComment = new commentModel({comment  , username , postId})
    await newComment.save()
    res.json({msg : 'Comment added'})
})

app.get('/comments/:item' , auth , async (req , res) => {
    const postId = req.params.item
    const result = await commentModel.find({postId}).sort({createdAt : -1})
    res.json({comments : result})
})

app.listen(4000 , () => {
    console.log('Listening on PORT 4000');
})