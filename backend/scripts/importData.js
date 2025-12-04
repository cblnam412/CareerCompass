import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

import University from '../models/University.js';
import Major from '../models/Major.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

// parse helpers
const parseSubjectGroups = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s);
};

const parseNumber = (str) => {
    if (!str) return 0;
    const cleanStr = str.toString().replace(/[^0-9.]/g, '');
    return Number(cleanStr) || 0;
};

// Read Excel
const filePath = path.join(__dirname, '../crawl/Uni.xlsx');
const workbook = XLSX.readFile(filePath);

// Convert sheet to JSON
const universitiesSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Universities']);
const majorsSheet = XLSX.utils.sheet_to_json(workbook.Sheets['Majors']);

const importUniversities = async () => {
    const results = universitiesSheet.map(row => ({
        code: row['idTruong'],
        shortName: row['shortName'],
        fullName: row['fullName'],
        address: row['address'],
        phone1: row['phone1'],
        phone2: row['phone2'],
        website: row['website'],
        slug: row['slug'],
        url: row['url']
    }));

    await University.insertMany(results);
    console.log(`✅ Đã nhập ${results.length} trường đại học.`);
};

const importMajors = async () => {
    const results = majorsSheet.map(row => ({
        universityCode: row['idTruong'],
        majorId: row['idNganh'],
        majorCode: row['maNganh'],
        name: row['tenNganh'],
        subjectGroups: parseSubjectGroups(row['toHopMon']),
        year: parseNumber(row['nam']),
        admissionScore: parseNumber(row['diemchuan']),
        tuitionFee: parseNumber(row['hocPhi']),
    }));

    await Major.insertMany(results);
    console.log(`✅ Đã nhập ${results.length} ngành học.`);
};

const run = async () => {
    await connectDB();

    await University.deleteMany({});
    await Major.deleteMany({});
    console.log("🗑️ Đã xóa dữ liệu cũ.");

    await importUniversities();
    await importMajors();

    console.log("🎉 Hoàn tất nhập dữ liệu.");
    process.exit();
};

run();
export default run;