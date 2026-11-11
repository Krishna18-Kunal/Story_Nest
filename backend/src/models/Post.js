const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
 title:{type:String,required:[true,'Title is required'],trim:true,maxlength:160},
 content:{type:String,required:[true,'Content is required'],trim:true},
 author:{type:String,trim:true,default:'Story Nest Member'},
 authorId:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null,index:true},
 imageUrl:{type:String,default:''}
},{timestamps:true});
module.exports=mongoose.models.Post||mongoose.model('Post',postSchema);
