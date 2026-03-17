import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT token
const generateTojen= (id)=> {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d",
    })
}

// @desc Register new user
// @route POST /api/auth/register
// @access Public