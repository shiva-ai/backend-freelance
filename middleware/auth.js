const jwt = require('jsonwebtoken')
const JWT_SECRET = '@2Fk!4T#9hPd$Xy78*Lq&Z0oR~a^EwUvMkJ1%'

module.exports = function (req, res , next) {
    const token = req.cookies.token

    if(!token){
        return res.json({msg : "No token"})
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        req.userId = decoded.id
        next()
    } catch(err){
        res.json({err })
    }

}
