import express from "express"
import cors from "cors";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.config.js";
import userRoutes from "./src/routes/user.routes.js"
import recordRoutes from "./src/routes/record.routes.js"

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
connectDB();





app.use("/api/user",userRoutes)
app.use("/api/record",recordRoutes)


app.get("/", (req, res) => {
    res.send("API is Up and Running");
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})