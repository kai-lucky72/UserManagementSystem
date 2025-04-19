import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, LoginData } from "@shared/schema";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const customFields = {
  workIdField: 'workId',
  emailField: 'email',
  passwordField: 'password'
};

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "agent-management-system-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions every 24h
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Custom verify function for login with both workId and email
  const verifyCallback = async (req: Request, username: string, password: string, done: any) => {
    try {
      const workId = req.body.workId;
      const email = req.body.email;
      
      if (!workId || !email) {
        return done(null, false, { message: "Both Work ID and Email are required" });
      }
      
      const user = await storage.getUserByWorkIdAndEmail(workId, email);
      
      if (!user) {
        return done(null, false, { message: "User not found" });
      }
      
      if (!user.isActive) {
        return done(null, false, { message: "Account inactive. Please contact administrator." });
      }
      
      const isValid = await comparePasswords(password, user.password);
      
      if (!isValid) {
        return done(null, false, { message: "Incorrect password" });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy(
    { passReqToCallback: true, usernameField: 'email' },
    verifyCallback
  ));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Initialize database with default users if none exist
  await initializeDefaultUsers();

  // Routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Authentication failed" });
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Log login activity
        await storage.logActivity({
          userId: user.id,
          action: "login",
          details: `${user.firstName} ${user.lastName} (${user.role}) logged in`
        });
        
        return res.status(200).json({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          workId: user.workId,
          role: user.role,
          isActive: user.isActive
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const user = req.user as User;
    const userId = user?.id;
    
    req.logout(async (err) => {
      if (err) return next(err);
      
      // Log logout activity if user was authenticated
      if (userId) {
        await storage.logActivity({
          userId,
          action: "logout",
          details: `${user.firstName} ${user.lastName} (${user.role}) logged out`
        });
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user as User;
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      workId: user.workId,
      role: user.role,
      isActive: user.isActive
    });
  });

  app.post("/api/help-requests", async (req, res) => {
    try {
      const helpRequest = await storage.createHelpRequest(req.body);
      res.status(201).json(helpRequest);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });
}

async function initializeDefaultUsers() {
  try {
    // Check if any users exist
    const anyUser = await storage.getUserCount();
    
    if (anyUser === 0) {
      console.log("Initializing default users...");
      
      // Create Admin
      const adminUser: InsertUser = {
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        workId: "ADM001",
        password: await hashPassword("admin123"),
        role: "Admin",
        isActive: true
      };
      const admin = await storage.createUser(adminUser);
      
      // Create Manager
      const managerUser: InsertUser = {
        firstName: "Michael",
        lastName: "Johnson",
        email: "manager@example.com",
        workId: "MGR001",
        password: await hashPassword("manager123"),
        role: "Manager",
        isActive: true
      };
      const manager = await storage.createUser(managerUser);
      
      // Create Sales Staff
      const salesStaffUser: InsertUser = {
        firstName: "Emily",
        lastName: "Brown",
        email: "sales@example.com",
        workId: "SLF001",
        password: await hashPassword("sales123"),
        role: "SalesStaff",
        managerId: manager.id,
        isActive: true
      };
      const salesStaff = await storage.createUser(salesStaffUser);
      
      // Create Agent
      const agentUser: InsertUser = {
        firstName: "John",
        lastName: "Doe",
        email: "agent@example.com",
        workId: "AGT001",
        password: await hashPassword("agent123"),
        role: "Agent",
        managerId: salesStaff.id,
        isActive: true
      };
      await storage.createUser(agentUser);
      
      console.log("Default users created successfully");
    }
  } catch (error) {
    console.error("Error initializing default users:", error);
  }
}
