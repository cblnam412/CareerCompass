import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from './config/db.js'; // Import kết nối DB

dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

export default app;