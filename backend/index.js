const dotenv = require('dotenv')
dotenv.config();
const express = require('express')
const bcrypt = require('bcrypt')
const {userModel} = require("./models")
const {Keypair,Connection,Transaction}= require('@solana/web3.js')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const secret = process.env.jwt_secret
const app = express()
app.use(express.json())
app.use(cors())

const connection = new Connection("https://api.devnet.solana.com")

app.post("/api/v1/signup", async (req,res)=>{
    const {username,password} = req.body;

    const existingUser = await userModel.findOne({username})

    if (existingUser){
        return res.status(409).send({
            message: "user already exists"
        })
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password,saltRounds)
    const keypair = new Keypair();

    const newUser = await userModel.create({
        username,
        password : hashedPassword,
        publicKey : keypair.publicKey.toString(),
        privateKey: JSON.stringify(Array.from(keypair.secretKey))
    })

    res.json({
        message: keypair.publicKey.toString()
    })
})

app.post("/api/v1/signin", async (req,res)=>{
    try{

        const {username,password} = req.body

        const user = await userModel.findOne({username})

        if (!user){
            return res.status(404).json({
                message: "user not found"
            })
        }
        const isPasswordCorrect = await bcrypt.compare(password,user.password)
        if (!isPasswordCorrect){
            return res.status(401).json({
                message: "password incorrect"
            })
        }

        const payload = {
            userId : user._id,
            username
        }

        const token = jwt.sign(payload,secret)
        res.status(200).json({
            message: "signin successful",
            token
        })

    }
    catch(e){
        res.status(500).json({
            message:"something failed"
        })
    }
})

const authMiddleware = async (req,res,next)=>{

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({
            message:"Authorization header missing"
        })
    }

    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token,secret);
        req.user = await userModel.findById(decoded.userId)

        if (!req.user){
            return res.status(404).json({
                message: "user not found"
            })
        }

        next();

    }
    catch(err){
        return res.status(401).json({
            message:'invalid token'
        })
    }

}

// app.post('/api/v1/txn/sign',authMiddleware , async (req,res)=>{

app.post("/api/v1/txn/sign", async (req,res)=>{

    try{

        const serializedTransaction = req.body.message;

        const tx = Transaction.from(Buffer.from(serializedTransaction, 'base64'))

        const username = 'rakesh'
        const user = await userModel.findOne({username})

        const privateKey = JSON.parse(user.privateKey)
        const userKeypair = Keypair.fromSecretKey(Uint8Array.from(privateKey))

        const {blockhash} = await connection.getLatestBlockhash()
        
        console.log("userKeypair    :    "+userKeypair)
        tx.blockhash = blockhash
        tx.feePayer = userKeypair.publicKey

        tx.sign(userKeypair)

        const signature = await connection.sendRawTransaction(tx.serialize())

        await connection.confirmTransaction(signature, 'confirmed')

        res.json({
            message:"Transaction signed and sent successfully",
            signature
        })
    }
    catch(err){
        res.status(408).json({
            message : "failed to sign"
        })
    }
})

app.get("/api/v1/txn", (req,res)=>{


    res.json({
        message:"signin"
    })
})

app.listen(3000,()=>{
    console.log("serving on port 3000")
})