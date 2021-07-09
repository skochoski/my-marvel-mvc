import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    minlength: 5,
    required: [true, "Valid username is required!"],
    unique: true
  },
  email: {
    type: String,
    required: [true, "Valid e-mail is required!"],
    unique: true
  },
  password: {
    type: String,
    minlength: 8,
    required: [true, "Valid password is required!"],
  },
  isUserVerified: {
    type: Boolean,
    default: false
  },
  verifyEmailToken: String,
  verifyEmailTokenExpiration: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpiration: Date
});

export default mongoose.model('User', userSchema);
