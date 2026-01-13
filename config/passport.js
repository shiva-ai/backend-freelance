const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const userModel = require('../models/User')

passport.use(
    new GoogleStrategy({
        clientID : process.env.GOOGLE_CLIENT_ID,
        clientSecret : process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:'/google/callback'
    } , 

    async (accessToken , refreshToken , profile , done) => {
        try{
            const email = profile.emails[0].value
            let user = await userModel.findOne({email})

            if(!user){
                user = await userModel.create({
                    username : profile.displayName,
                    email,
                    password: "1234"
                })
            }

            done(null , user)
        }
        catch (err){
            done(err , null)
        }
    }
)
)