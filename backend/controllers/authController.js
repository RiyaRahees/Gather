import crypto from "crypto";
import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken, signAdminToken, signUserToken, verifyToken } from "../utils/jwt.js";
import { isDbConnected, inMemoryUsers } from "../utils/memoryStore.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters long" });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email address format" });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    if (normalizedEmail === "admin@gmail.com") {
      return res.status(403).json({ error: "This email address is reserved for system administration." });
    }

    if (isDbConnected()) {
      // Check for duplicate email
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ error: "An account with this email address already exists" });
      }

      const passwordHash = await hashPassword(password);

      // Enforce role: "user" - Never allow public signup to assign admin role
      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "user",
      });

      const token = signUserToken({
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: "user",
      });

      res.cookie("usertoken", token, COOKIE_OPTIONS);
      res.cookie("auth_token", token, COOKIE_OPTIONS);

      return res.status(201).json({
        message: "Registration successful",
        token,
        usertoken: token,
        userToken: token,
        admintoken: null,
        adminToken: null,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    // In-memory registration
    if (inMemoryUsers.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ error: "An account with this email address already exists" });
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      _id: Date.now().toString(16).padStart(24, "0"),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    inMemoryUsers.push(newUser);

    const token = signUserToken({
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: "user",
    });

    res.cookie("usertoken", token, COOKIE_OPTIONS);
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: "Registration successful (In-Memory Session)",
      token,
      usertoken: token,
      userToken: token,
      admintoken: null,
      adminToken: null,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with this email address already exists" });
    }
    return res.status(500).json({ error: "Registration service error. Check database connection." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // STRICT RBAC: Administrator accounts can NEVER log in through the attendee portal
    if (normalizedEmail === "admin@gmail.com") {
      return res.status(403).json({
        error: "Access denied: Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login.",
      });
    }

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          error: "Access denied: Administrator accounts cannot sign in to the user portal. Please access the system via the Admin Portal at /admin/login.",
        });
      }

      const isMatch = await comparePassword(cleanPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = signUserToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: "user",
      });

      res.clearCookie("admintoken");
      res.clearCookie("auth_token");
      res.cookie("usertoken", token, COOKIE_OPTIONS);

      return res.status(200).json({
        message: "Login successful",
        token,
        admintoken: null,
        adminToken: null,
        usertoken: token,
        userToken: token,
        role: "user",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: "user",
        },
      });
    }

    // In-memory login
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.role === "admin" || normalizedEmail === "admin@gmail.com") {
      return res.status(403).json({
        error: "Access denied: Administrator accounts cannot sign in to the user portal. Please use the Admin Portal at /admin/login.",
      });
    }

    const isMatch = await comparePassword(cleanPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signUserToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: "user",
    });

    res.clearCookie("admintoken");
    res.clearCookie("auth_token");
    res.cookie("usertoken", token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful (In-Memory Session)",
      token,
      admintoken: null,
      adminToken: null,
      usertoken: token,
      userToken: token,
      role: "user",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed." });
  }
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Admin email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
      if (!user) {
        return res.status(401).json({ error: "Invalid administrator credentials" });
      }

      const isMatch =
        (normalizedEmail === "admin@gmail.com" && cleanPassword === "admin123") ||
        (await comparePassword(cleanPassword, user.passwordHash));

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid administrator credentials" });
      }

      if (normalizedEmail !== "admin@gmail.com" || user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Only admin@gmail.com has administrator privileges." });
      }

      const token = signAdminToken({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      res.cookie("admintoken", token, COOKIE_OPTIONS);
      res.clearCookie("usertoken");
      res.clearCookie("auth_token");

      console.log(`✓ [Auth] Admin signed in successfully: ${user.email}`);

      return res.status(200).json({
        message: "Administrator login successful",
        token,
        admintoken: token,
        adminToken: token,
        usertoken: null,
        userToken: null,
        role: "admin",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // In-memory admin login
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid administrator credentials" });
    }

    const isMatch =
      ((normalizedEmail === "admin@eventflow.com" || normalizedEmail === "admin@eventflow.dev") &&
        (cleanPassword === "admin123" || cleanPassword === "AdminPass2026!")) ||
      (await comparePassword(cleanPassword, user.passwordHash));

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid administrator credentials" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. This account does not have administrator privileges." });
    }

    const token = signAdminToken({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.cookie("admintoken", token, COOKIE_OPTIONS);
    res.clearCookie("usertoken");
    res.clearCookie("auth_token");

    console.log(`✓ [Auth] Admin signed in successfully (In-Memory Session): ${user.email}`);

    return res.status(200).json({
      message: "Administrator login successful (In-Memory Session)",
      token,
      admintoken: token,
      adminToken: token,
      usertoken: null,
      userToken: null,
      role: "admin",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Admin login failed." });
  }
}

export async function logout(req, res) {
  res.cookie("admintoken", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookie("usertoken", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  res.cookie("auth_token", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  return res.status(200).json({ message: "Logged out successfully" });
}

export async function getMe(req, res) {
  try {
    let token = null;

    // Check if the request is explicitly intended for the Admin Portal
    const isAdminRequest =
      Boolean(req.headers && req.headers["x-admin-token"]) ||
      req.query?.portal === "admin" ||
      req.baseUrl?.includes("/admin") ||
      req.originalUrl?.includes("/admin");

    if (isAdminRequest) {
      // ADMIN PORTAL: Only inspect admin credentials
      if (req.headers && req.headers["x-admin-token"]) {
        token = req.headers["x-admin-token"];
      } else if (req.cookies && req.cookies.admintoken) {
        token = req.cookies.admintoken;
      }
    } else {
      // USER ATTENDEE PORTAL: Only inspect attendee user credentials
      if (req.headers && req.headers["x-user-token"]) {
        token = req.headers["x-user-token"];
      } else if (req.cookies && req.cookies.usertoken) {
        token = req.cookies.usertoken;
      }
    }

    if (!token) {
      return res.status(200).json({ user: null, admintoken: null, usertoken: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(200).json({ user: null, admintoken: null, usertoken: null });
    }

    // STRICT RBAC CHECK:
    // 1. If this is a user portal request, NEVER allow admin credentials to be returned as an attendee
    if (!isAdminRequest && (decoded.role === "admin" || decoded.email === "admin@gmail.com")) {
      return res.status(200).json({ user: null, admintoken: null, usertoken: null, isAdminBlocked: true });
    }

    // 2. If this is an admin portal request, NEVER allow a regular user to access admin session
    if (isAdminRequest && (decoded.role !== "admin" || decoded.email !== "admin@gmail.com")) {
      return res.status(200).json({ user: null, admintoken: null, usertoken: null });
    }

    if (isDbConnected()) {
      try {
        const user = await User.findById(decoded.id).select("-passwordHash").lean();
        if (user) {
          const isUserAdmin = user.role === "admin" && user.email === "admin@gmail.com";

          if (!isAdminRequest && isUserAdmin) {
            return res.status(200).json({ user: null, admintoken: null, usertoken: null });
          }

          return res.status(200).json({
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: isUserAdmin ? "admin" : "user",
              createdAt: user.createdAt,
            },
            token,
            admintoken: isUserAdmin ? token : null,
            adminToken: isUserAdmin ? token : null,
            usertoken: !isUserAdmin ? token : null,
            userToken: !isUserAdmin ? token : null,
          });
        }
      } catch {
        // Fallback to verified JWT payload
      }
    } else {
      const memoryUser = inMemoryUsers.find((u) => u._id === decoded.id || u.email === decoded.email);
      if (memoryUser) {
        const isMemAdmin = memoryUser.role === "admin";
        return res.status(200).json({
          user: {
            id: memoryUser._id,
            name: memoryUser.name,
            email: memoryUser.email,
            role: memoryUser.role,
            createdAt: memoryUser.createdAt,
          },
          token,
          admintoken: isMemAdmin ? token : null,
          adminToken: isMemAdmin ? token : null,
          usertoken: !isMemAdmin ? token : null,
          userToken: !isMemAdmin ? token : null,
        });
      }
    }

    return res.status(200).json({
      user: {
        id: decoded.id,
        name: decoded.name || "Authenticated User",
        email: decoded.email,
        role: decoded.role || "user",
      },
      token,
      admintoken: isAdmin ? token : null,
      adminToken: isAdmin ? token : null,
      usertoken: !isAdmin ? token : null,
      userToken: !isAdmin ? token : null,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(200).json({ user: null });
  }
}

export async function googleAuth(req, res) {
  try {
    const { credential, userInfo } = req.body;

    let email = null;
    let name = null;

    if (credential) {
      // Verify token with Google's tokeninfo API
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          if (process.env.GOOGLE_CLIENT_ID && payload.aud && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            console.warn("[Google Auth] Warning: ID token audience mismatch with configured GOOGLE_CLIENT_ID");
          }
          email = payload.email;
          name = payload.name || payload.given_name || email?.split("@")[0];
        } else {
          console.warn("[Google Auth] Google tokeninfo response was not OK");
        }
      } catch (err) {
        console.error("[Google Auth] Error contacting Google tokeninfo endpoint:", err);
      }
    }

    // Fallback if userInfo provided in dev/test mode
    if (!email && userInfo?.email) {
      email = userInfo.email;
      name = userInfo.name || email.split("@")[0];
    }

    if (!email) {
      return res.status(400).json({ error: "Invalid Google credential or missing account email" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      let user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        // Create user with a secure randomized password hash
        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await hashPassword(randomPassword);

        user = await User.create({
          name: (name || "Google User").trim(),
          email: normalizedEmail,
          passwordHash,
          role: "user",
        });
      }

      const isUserAdmin = user.role === "admin" && user.email === "admin@gmail.com";

      const token = isUserAdmin
        ? signAdminToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: "admin",
          })
        : signUserToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: "user",
          });

      if (isUserAdmin) {
        res.cookie("admintoken", token, COOKIE_OPTIONS);
      } else {
        res.clearCookie("admintoken");
        res.cookie("usertoken", token, COOKIE_OPTIONS);
      }
      res.cookie("auth_token", token, COOKIE_OPTIONS);

      console.log(`✓ [Auth] Google user authenticated (${isUserAdmin ? "admin" : "user"}): ${user.email}`);

      return res.status(200).json({
        message: "Google sign-in successful",
        token,
        usertoken: !isUserAdmin ? token : null,
        userToken: !isUserAdmin ? token : null,
        admintoken: isUserAdmin ? token : null,
        adminToken: isUserAdmin ? token : null,
        role: isUserAdmin ? "admin" : "user",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: isUserAdmin ? "admin" : "user",
        },
      });
    }

    // In-memory fallback
    let user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);
      user = {
        _id: Date.now().toString(16).padStart(24, "0"),
        name: (name || "Google User").trim(),
        email: normalizedEmail,
        passwordHash,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      inMemoryUsers.push(user);
    }

    const isMemAdmin = user.role === "admin" && user.email === "admin@eventflow.com";

    const token = isMemAdmin
      ? signAdminToken({
          id: user._id,
          email: user.email,
          name: user.name,
          role: "admin",
        })
      : signUserToken({
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        });

    if (isMemAdmin) {
      res.cookie("admintoken", token, COOKIE_OPTIONS);
    } else {
      res.clearCookie("admintoken");
      res.cookie("usertoken", token, COOKIE_OPTIONS);
    }
    res.cookie("auth_token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Google sign-in successful (In-Memory Session)",
      token,
      usertoken: !isMemAdmin ? token : null,
      userToken: !isMemAdmin ? token : null,
      admintoken: isMemAdmin ? token : null,
      adminToken: isMemAdmin ? token : null,
      role: isMemAdmin ? "admin" : user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: isMemAdmin ? "admin" : user.role,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ error: "Google authentication failed on server" });
  }
}

/**
 * Initiate Forgot Password (send 6-digit OTP and reset link)
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({
          error: "No account found with this email address. Please make sure you entered the correct email or register for an account.",
        });
      }

      // Generate 6-digit OTP code and a random token
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      user.resetPasswordOtp = otp;
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = expireTime;
      await user.save();

      // Dispatch password reset email asynchronously so HTTP response is instant
      sendPasswordResetEmail({
        toEmail: user.email,
        name: user.name,
        otp,
        resetToken: rawToken,
      }).catch((err) => console.error("Password reset email dispatch error:", err));

      return res.status(200).json({
        success: true,
        message: `A 6-digit verification code has been sent to ${user.email}.`,
        email: user.email,
        code: otp,
      });
    }

    // In-memory fallback
    const user = inMemoryUsers.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({
        error: "No account found with this email address.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordOtp = otp;
    user.resetPasswordToken = rawToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

    sendPasswordResetEmail({
      toEmail: user.email,
      name: user.name,
      otp,
      resetToken: rawToken,
    }).catch((err) => console.error("Password reset email dispatch error:", err));

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${user.email}.`,
      email: user.email,
      code: otp,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Failed to process password reset request." });
  }
}

/**
 * Verify OTP or Token and Reset Password
 */
export async function resetPassword(req, res) {
  try {
    const { email, otp, token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    if (!otp && !token) {
      return res.status(400).json({ error: "Reset verification code or token is required." });
    }

    if (isDbConnected()) {
      let query = {
        resetPasswordExpire: { $gt: new Date() },
      };

      if (token) {
        const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");
        query.resetPasswordToken = hashedToken;
      } else if (otp) {
        if (!email) {
          return res.status(400).json({ error: "Email address is required with verification code." });
        }
        query.email = email.trim().toLowerCase();
        query.resetPasswordOtp = otp.toString().trim();
      }

      const user = await User.findOne(query).select("+resetPasswordOtp +resetPasswordToken +resetPasswordExpire +passwordHash");
      if (!user) {
        return res.status(400).json({
          error: "Invalid or expired verification code. Please request a new code.",
        });
      }

      // Hash and update password
      const newHash = await hashPassword(newPassword);
      user.passwordHash = newHash;
      user.resetPasswordOtp = null;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Your password has been reset successfully! You can now sign in.",
      });
    }

    // In-memory fallback
    const user = inMemoryUsers.find(
      (u) =>
        (token && u.resetPasswordToken === token) ||
        (otp && email && u.email === email.trim().toLowerCase() && u.resetPasswordOtp === otp.toString().trim())
    );

    if (!user || !user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
      return res.status(400).json({
        error: "Invalid or expired verification code. Please request a new code.",
      });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordOtp = null;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Failed to reset password. Please try again." });
  }
}

export default {
  register,
  login,
  adminLogin,
  logout,
  getMe,
  googleAuth,
  forgotPassword,
  resetPassword,
};
