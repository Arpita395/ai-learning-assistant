import jwt from "jsonwebtoken";
import User from '../models/User.js'

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if(!req.user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
            statusCode: 401
        })
      }

      next();
    } catch (error) {
      console.error("Not authorized, token failed");

      if(error.name=== 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token has expired',
            statusCode: 401
        })
      }

      return res.status(401).json({
            success: false,
            error: 'NOt authorized, token failed',
            statusCode: 401
        })
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
};

export default protect;