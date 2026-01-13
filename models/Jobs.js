const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
    jobTitle : {
        type : String,
        required : true
    } , 
    
    jobDescription : {
        type : String ,
        required : true
    } ,
    cost : {
        type : String ,
        required : true
    },

    tags : {
        type : [String] ,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true
    },
},
     {
        timestamps: true,
    },
)

module.exports = mongoose.model("Jobs" ,  jobSchema)