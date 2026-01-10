import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import affiliationRoutes from './routes/affiliationRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import subjectCombinationRoutes from './routes/subjectCombinationRoutes.js';
import softSkillRoutes from './routes/softSkillRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import mockExamRoutes from './routes/mockExamRoutes.js';
import personalityQuizRoutes from './routes/personalityQuizRoutes.js';
import majorRoutes from './routes/majorRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import universityMajorRoutes from './routes/universityMajorRoutes.js';
import studentSubjectScoreRoutes from './routes/studentSubjectScoreRoutes.js';
import majorRecommentdationRoutes from './routes/majorRecommendationRoutes.js' ;
import { initializeSocket } from './socket.js';

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/affiliations', affiliationRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api', subjectCombinationRoutes);
app.use('/api', softSkillRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api', mockExamRoutes);
app.use('/api', personalityQuizRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/university-majors', universityMajorRoutes);
app.use('/api/scores', studentSubjectScoreRoutes);
app.use('/api/major-recommendations', majorRecommentdationRoutes);

initializeSocket(io);

server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

export default app;