import bcrypt from "bcrypt";
import type { RequestHandler } from "express";
import { storage } from "./storage";
import { z } from "zod";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signup: RequestHandler = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = signupSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await storage.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: "user",
    });

    (req.session as any).userId = user.id;
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
};

export const signin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = signinSchema.parse(req.body);

    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    (req.session as any).userId = user.id;
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Signin error:", error);
    res.status(500).json({ error: "Failed to sign in" });
  }
};

export const signout: RequestHandler = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ error: "Failed to sign out" });
    }
    res.json({ message: "Signed out successfully" });
  });
};

export const isAuthenticatedTraditional: RequestHandler = async (req, res, next) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).user = { claims: { sub: user.id } };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
