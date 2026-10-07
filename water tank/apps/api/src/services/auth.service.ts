import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { userRepository } from "../repositories/user.repository.js";
import { ApiError } from "../utils/errors.js";

const hashRefreshToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user: { id: string; name: string; email: string; role: Role }) =>
  jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] }
  );

const createRefreshToken = async (userId: string) => {
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt
    }
  });

  return refreshToken;
};

export const authService = {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ApiError(409, "Email is already registered");
    }

    const userCount = await userRepository.count();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const role = userCount === 0 ? Role.ADMIN : Role.USER;

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role,
        settings: { create: {} }
      }
    });

    return this.createSession(user);
  },

  async login(input: { email: string; password: string }) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new ApiError(401, "Invalid email or password");
    }

    return this.createSession(user);
  },

  async refresh(refreshToken: string) {
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!stored) {
      throw new ApiError(401, "Invalid refresh token");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    return this.createSession(stored.user);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  },

  async createSession(user: { id: string; name: string; email: string; role: Role }) {
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }
};
