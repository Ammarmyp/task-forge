import { Context } from "hono";
import { LoginSchema, NewUserSchema } from "../../utils/validation-schema";
import { db } from "../../../prisma/client";
import { comparePassword, hashPassword } from "../../utils/hash";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../utils/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { env } from "../../utils/env";

const enum TOKENS {
  REFRESH_TOKEN = "refresh_token",
  ACCESS_TOKEN = "access_token",
}

export const signup = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = NewUserSchema.safeParse(body);

    if (!parsed.success) return c.json({ error: "Invalid user format" }, 400);

    const { email, password } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) return c.json({ error: "User already exists" }, 409);

    const user = await db.user.create({
      data: {
        email,
        password: await hashPassword(password),
      },
    });

    const token = await signAccessToken(user.id);

    return c.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    return c.json({ error, message: "Something went wrong!" }, 500);
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) return c.json({ error: "Invalid input" }, 400);

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password)))
      return c.json({ error: "Invalid credentials" }, 401);

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    await db.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    // setting both tokens as http only cookies for secuirity
    setCookie(c, TOKENS.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    setCookie(c, TOKENS.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return c.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return c.json({ error, message: "Something went wrong" }, 500);
  }
};

export const refreshHandler = async (c: Context) => {
  try {
    const refreshToken = getCookie(c, TOKENS.REFRESH_TOKEN);
    if (!refreshToken) return c.json({ message: "No refresh token" }, 401);

    try {
      const decodedToken = await verifyToken(refreshToken, env.REFRESH_SECRET);
      if (decodedToken?.role !== "REFRESH")
        return c.json({ message: "Invalid token type " }, 403);

      const session = await db.session.findUnique({
        where: { refreshToken },
      });
      if (!session || session.expiresAt < new Date()) {
        return c.json({ message: "Token is either expired or invalid" }, 403);
      }
      const newAccessToken = await signAccessToken(decodedToken.sub);

      setCookie(c, TOKENS.ACCESS_TOKEN, newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 15,
      });

      return c.json({ message: "Access Token refreshed" });
    } catch (error) {
      return c.json({ error, message: "something went wrong!" });
    }
  } catch (error) {
    return c.json({ error, message: "something went wrong!" });
  }
};
