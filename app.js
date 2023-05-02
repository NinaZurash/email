const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

require("dotenv").config();

const { User } = require("./schemas/user.schema.js");
const { sendVerificationEmail } = require("./email.js");

const allowedOrigins = [
    /^http:\/\/localhost(:\d+)?$/,
    /^https?:\/\/.*\.web\.cern\.ch$/,
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
};

const db = require("./db");
const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Test the database connection and sync the models
(async () => {
    try {
        await db.authenticate();
        console.log("Database connection has been established successfully.");
        await db.sync();
        console.log("tables have been synced.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
})();

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    const emailVerificationToken = crypto.randomBytes(64).toString("hex");

    try {
        await User.create({
            email,
            password,
            emailVerificationToken,
        });
        sendVerificationEmail(email, emailVerificationToken);
        res.status(201).json({
            ok: true,
            message: "User created, verification email sent",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            response: {
                ok: false,
            },
            message: "an error occured",
        });
    }
});

app.get("/verify-email", async (req, res) => {
    const emailVerificationToken = req.query.token;

    try {
        const user = await User.findOne({ where: { emailVerificationToken } });

        if (!user) {
            return res.status(400).json({
                ok: false,
                message: "Invalid verification token",
            });
        }

        await user.update({
            isEmailVerified: true,
            emailVerificationToken: null,
        });

        res.status(200).json({
            ok: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            message: "Can't verify email",
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
