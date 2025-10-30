const mongoose = require("mongoose")

mongoose.connect("mongodb+srv://unextgenfome:00uOjNJBD9DCOEUo@cluster0.njmp9da.mongodb.net/band")

const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    privateKey: String,
    publicKey: String
})

const userModel = mongoose.model("users",UserSchema);

module.exports= {
    userModel
} 