const fs = require("fs")
const axios = require("axios")

const ZEUS_URL = "http://localhost:10000"

const scorecardPath = "./zeus-scorecard.json"

async function updateScore(module,status){

 const data = JSON.parse(fs.readFileSync(scorecardPath))

 data.zeusRoadmap[module].status = status

 fs.writeFileSync(scorecardPath,JSON.stringify(data,null,2))
}

async function testImport(){

 try{

  const res = await axios.post(`${ZEUS_URL}/import/product`,{
   title:"Test Product",
   description:"Test",
   source:"test"
  })

  if(res.data.status==="processed"){
   await updateScore("importPipeline","OK")
  }

 }catch{
  await updateScore("importPipeline","FAIL")
 }
}

async function run(){

 console.log("ZEUS SYSTEM TEST")

 await testImport()

 console.log("Scorecard actualizado")
}

run()
