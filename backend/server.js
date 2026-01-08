import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import affiliationRoutes from './routes/affiliationRoutes.js';
import subjectCombinationRoutes from './routes/subjectCombinationRoutes.js';
import softSkillRoutes from './routes/softSkillRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import mockExamRoutes from './routes/mockExamRoutes.js';
import personalityQuizRoutes from './routes/personalityQuizRoutes.js';
import majorRoutes from './routes/majorRoutes.js';
import universityRoutes from './routes/universityRoutes.js';
import universityMajorRoutes from './routes/universityMajorRoutes.js';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/admin', affiliationRoutes);
app.use('/api', subjectCombinationRoutes);
app.use('/api', softSkillRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api', mockExamRoutes);
app.use('/api', personalityQuizRoutes);
app.use('/api/majors', majorRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/university-majors', universityMajorRoutes);


app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

export default app;