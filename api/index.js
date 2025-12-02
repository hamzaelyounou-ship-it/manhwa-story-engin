// simplified for package
const express=require('express');const axios=require('axios');const bodyParser=require('body-parser');const cors=require('cors');
const app=express();app.use(bodyParser.json());app.use(cors());
const PORT=process.env.PORT||3000;
const OR=process.env.OPENROUTER_API_KEY;
const MANHWA=`You are a manhwa generator.`;
function cfg(){return {url:'https://openrouter.ai/api/v1/chat/completions'};}
app.post('/api/generate',async(req,res)=>{
  const {title,description,model,apiKey}=req.body;
  try{
    const r=await axios.post(cfg().url,{
      model,
      messages:[
        {role:'system',content:MANHWA},
        {role:'user',content:`${title}\n${description}`}
      ]
    },{headers:{Authorization:`Bearer ${apiKey||OR}`,'Content-Type':'application/json'}});
    res.json({ok:true,data:r.data});
  }catch(e){res.status(500).json({error:'fail'})}
});
app.listen(PORT);