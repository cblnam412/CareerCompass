import mongoose  from "mongoose";
const softSkillSchema = new mongoose.Schema({
    softSkillName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
});

const SoftSkill = mongoose.model('SoftSkill', softSkillSchema);

export default SoftSkill;