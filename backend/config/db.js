import mongoose from "mongoose";

let isConnected = false;

// Configure timeout so queries fail quickly if disconnected rather than hanging
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 3000);

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️  [MongoDB] MONGODB_URI is not set in environment. Database features will be limited.");
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`✓  [MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error("⚠️  [MongoDB] Connection error:", error.message);
    console.error("👉  Make sure your IP is whitelisted on MongoDB Atlas (Security -> Network Access -> Allow 0.0.0.0/0).");
    return null;
  }
}

export default connectDB;
