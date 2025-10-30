import {Transaction,Connection,PublicKey, SystemProgram, LAMPORTS_PER_SOL} from "@solana/web3.js"
import './App.css'
import axios from "axios"

const connection = new Connection("https://solana-devnet.g.alchemy.com/v2/lOw2ipOTE8ZDhNuHt-a6W")
const fromPubkey = new PublicKey("6iDKPRzSy2AbscQ87Tp1Xg49mT7aeZjjXVDwGr2XpEma")
function App() {
  
  async function sendSol(){

    const ix = SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey("Bkd68K3g2vEJDutub2kGhBMWYQ7gapFhbjYoiGwPbbri"),
      lamports: 0.001*LAMPORTS_PER_SOL,
    })
    
    const tx = new Transaction().add(ix);//can add more instructions here like .add(ix).add(ix) and so on
    const {blockhash} = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = fromPubkey

    const serializeTx = tx.serialize({
      requireAllSignatures:false,
      verifySignatures: false
    })//converting transaction to bunch of bytes to send to BE

    console.log(serializeTx)

    axios.post("/api/v1/txn/sign",{

      message: serializeTx,
      retry:false

    })

  }

  return (
    <>
      <div>
        <input type="text" placeholder='Amount' />
        <input type="text" placeholder='Address' />
        <button onClick={sendSol}>Submit</button>
      </div>
    </>
  )
}

export default App
