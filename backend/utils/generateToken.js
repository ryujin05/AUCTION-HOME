import jwt from "jsonwebtoken";


export const generateTokenAndSetCookie = (res, userId, role) => {
    
    const age = 1 * 60 * 60 * 1000; // 1 giờ

    const isAdmin = role === "admin"; 

    const token = jwt.sign(
        { 
            _id: userId, 
            role: role,     
            isAdmin: isAdmin
        }, 
        process.env.JWT_SECRET_KEY,
        { expiresIn: age }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: age,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
};