import { Context } from "hono";
import { LoginSchema, NewUserSchema } from "../../utils/validation-schema";
import { db } from "../../../prisma/client";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";

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

    const token = await signToken(user.id);

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
    if (!user) return c.json({ error: "Invalid credentials" }, 401);

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return c.json({ error: "Invalid credentials" }, 401);

    const token = await signToken(user.id);
    return c.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    return c.json({ error, message: "Something went wrong" }, 500);
  }
};
