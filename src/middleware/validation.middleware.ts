import { Request, Response, NextFunction } from "express";

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (minimum 6 characters)
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Middleware to validate register data
export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({
      error: "Full name, email, and password are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long",
    });
  }

  next();
};

// Middleware to validate login data
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  next();
};

