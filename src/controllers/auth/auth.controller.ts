import { Context } from "hono";
import { LoginSchema, NewUserSchema } from "../../utils/validation-schema";
import { db } from "../../../prisma/client";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { setCookie } from "hono/cookie";

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
    setCookie(c, "access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 15,
    });

    setCookie(c, "refresh_token", refreshToken, {
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
