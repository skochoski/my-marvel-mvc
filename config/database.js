import mongoose from 'mongoose';

const connectDB = () => {
  return mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@sub-zero.uzvil.mongodb.net/${process.env.MONGO_DATABASE}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      autoIndex: false,
      poolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    },
    console.log(`${'*'.repeat(10)}Database is Ready${'*'.repeat(10)}`)
  );
};

const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@sub-zero.uzvil.mongodb.net/${process.env.MONGO_DATABASE}`;

export { connectDB, MONGO_URI }
