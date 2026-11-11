require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const cookieParser=require('cookie-parser');
const postsRouter=require('./routes/posts');
const authRouter=require('./routes/auth');
const reviewsRouter=require('./routes/reviews');
const questionsRouter=require('./routes/questions');
const app=express();const PORT=process.env.PORT||5000;
const allowedOrigins=(process.env.CLIENT_ORIGIN||'http://localhost:5173').split(',').map(x=>x.trim()).filter(Boolean);
app.use(cors({origin(origin,cb){if(!origin||allowedOrigins.includes(origin))return cb(null,true);return cb(new Error(`CORS blocked origin: ${origin}`));},credentials:true,methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','Authorization']}));
app.use(express.json({limit:'1mb'}));app.use(cookieParser());
app.use((req,res,next)=>{
  if(['POST','PUT','PATCH','DELETE'].includes(req.method) && req.headers.origin && !allowedOrigins.includes(req.headers.origin)) {
    return res.status(403).json({success:false,message:'Request origin is not allowed.'});
  }
  next();
});
app.get('/',(req,res)=>res.json({success:true,message:'Story Nest API is running.',routes:['/auth','/posts','/reviews','/questions']}));
app.get('/health',(req,res)=>res.json({success:true,status:'healthy',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.use('/auth',authRouter);app.use('/posts',postsRouter);app.use('/reviews',reviewsRouter);app.use('/questions',questionsRouter);
app.use((err,req,res,next)=>{console.error(err.stack||err);if(err.message?.startsWith('CORS blocked origin:'))return res.status(403).json({success:false,message:err.message});if(err.name==='MulterError')return res.status(400).json({success:false,message:err.message});if(err.name==='ValidationError')return res.status(400).json({success:false,message:err.message});res.status(500).json({success:false,message:'Internal server error',error:process.env.NODE_ENV==='production'?undefined:err.message});});
async function start(){if(!process.env.MONGO_URI){console.error('MONGO_URI is missing. Configure backend/.env');process.exit(1);}if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){console.error('JWT_SECRET must be set to a random string of at least 32 characters.');process.exit(1);}try{await mongoose.connect(process.env.MONGO_URI);console.log('MongoDB Atlas connected successfully');app.listen(PORT,'0.0.0.0',()=>console.log(`Story Nest API running at http://localhost:${PORT}`));}catch(e){console.error('MongoDB connection failed:',e.message);process.exit(1);}}
start();
