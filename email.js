const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "node9818@gmail.com",
        pass: "icydixwmdxbahdov",
    },
});

const sendVerificationEmail = (email, emailVerificationToken) => {
    const mailOptions = {
        from: "node9818@gmail.com",
        to: email,
        subject: "Email Verification",
        text: `Please click the following link to verify your email: ${process.env.HOST}/verify-email?token=${emailVerificationToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            new Error("Failed to send e-mail");
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

module.exports = {
    sendVerificationEmail,
};
