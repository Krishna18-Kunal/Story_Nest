const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const Post = require('../models/Post');
const Review = require('../models/Review');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const router = express.Router();
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter(req,file,cb){if(file.mimetype&&file.mimetype.startsWith('image/'))return cb(null,true);cb(new Error('Only image files are allowed.'));}});
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
function uploadBufferToCloudinary(buffer){return new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:'story-nest',resource_type:'image'},(error,result)=>error?reject(error):resolve(result));stream.end(buffer);});}
function validateId(req,res,next){if(!mongoose.Types.ObjectId.isValid(req.params.id))return res.status(400).json({success:false,message:'Invalid post ID.'});next();}
function ownerOnly(post,req,res){if(!post.authorId||post.authorId.toString()!==req.user._id.toString()){res.status(403).json({success:false,message:'You can modify only your own blog posts.'});return false;}return true;}

router.get('/',async(req,res,next)=>{try{const posts=await Post.find().sort({createdAt:-1});res.json({success:true,count:posts.length,data:posts});}catch(e){next(e);}});
router.get('/recent/top',async(req,res,next)=>{try{const posts=await Post.find().sort({createdAt:-1}).limit(3);res.json({success:true,count:posts.length,data:posts});}catch(e){next(e);}});
router.get('/:id',validateId,async(req,res,next)=>{try{const post=await Post.findById(req.params.id);if(!post)return res.status(404).json({success:false,message:'Post not found.'});res.json({success:true,data:post});}catch(e){next(e);}});
router.post('/',auth,upload.single('image'),async(req,res,next)=>{try{
 const title=String(req.body.title||'').trim(),content=String(req.body.content||'').trim();if(!title||!content)return res.status(400).json({success:false,message:'Title and content are required.'});
 let imageUrl='';if(req.file){if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return res.status(503).json({success:false,message:'Image upload is not configured.'});imageUrl=(await uploadBufferToCloudinary(req.file.buffer)).secure_url;}
 const post=await Post.create({title,content,author:req.user.name,authorId:req.user._id,imageUrl});res.status(201).json({success:true,message:'Post created successfully.',data:post});
}catch(e){next(e);}});
router.put('/:id',auth,validateId,upload.single('image'),async(req,res,next)=>{try{
 const post=await Post.findById(req.params.id);if(!post)return res.status(404).json({success:false,message:'Post not found.'});if(!ownerOnly(post,req,res))return;
 if(req.body.title!==undefined)post.title=String(req.body.title).trim();if(req.body.content!==undefined)post.content=String(req.body.content).trim();
 if(!post.title||!post.content)return res.status(400).json({success:false,message:'Title and content are required.'});
 if(req.file){if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET)return res.status(503).json({success:false,message:'Image upload is not configured.'});post.imageUrl=(await uploadBufferToCloudinary(req.file.buffer)).secure_url;}
 await post.save();res.json({success:true,message:'Post updated successfully.',data:post});
}catch(e){next(e);}});
router.delete('/:id',auth,validateId,async(req,res,next)=>{try{
 const post=await Post.findById(req.params.id);if(!post)return res.status(404).json({success:false,message:'Post not found.'});if(!ownerOnly(post,req,res))return;
 await Promise.all([Review.deleteMany({postId:post._id}),Question.deleteMany({postId:post._id})]);await post.deleteOne();res.json({success:true,message:'Post and its related reviews/questions deleted successfully.',data:post});
}catch(e){next(e);}});
module.exports=router;
