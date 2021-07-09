import mongoose from 'mongoose';
const { Schema, Types } = mongoose;

const postSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageName: { type: String, required: true },
  imageUrl: { type: String, required: true },
  creator: { type: String, required: true },
  creatorId: { type: Types.ObjectId, ref: 'User' },
  usersLiked: [{ type: String }],
  likesCount: { type: Number, default: 0 },
  comments: [{
    content: { type: String, required: true },
    creator: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
