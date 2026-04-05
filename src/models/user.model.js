import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required:true
    },
    email: {
        type: String,
        trim: true,
        required:true,
        unique:true
    },
    password: {
        type: String,
    },
    phoneNo: {
        type: String,
        trim: true,
        required:true
    },
    role: {
        type: String,
        enum: ["viewer", "analyst", "admin"],
        default: "viewer"
    },
    isActive: {
        type: Boolean,
        default: true
    }

},
    { timestamps: true }
)


userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema)