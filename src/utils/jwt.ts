import * as jwt from "jsonwebtoken";
import { sign, verify } from "hono/jwt";
import { env } from "./env";

export const signToken = async (userId: string) => {
  return await sign(
    { data: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
    env.SECRET
  );
};

export const verifyToken = async (
  token: string
): Promise<{ userId: string } | null> => {
  try {
    return (await verify(token, env.SECRET)) as { userId: string };
  } catch {
    return null;
  }
};
