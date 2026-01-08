import mongoose from "mongoose";
const majorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        //required: true,
    },
    description: {
        type: String,
    },
}, {
    timestamps: true
});
const Major = mongoose.model('Major', majorSchema);
export default Major;