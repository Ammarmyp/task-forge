import * as jwt from "jsonwebtoken";
import { sign, verify } from "hono/jwt";
import { env } from "./env";

type TokenPayloadType = {
  sub: string;
  role: "USER" | "REFRESH";
  exp: number | undefined;
};

export const signAccessToken = async (userId: string) => {
  const payload: TokenPayloadType = {
    sub: userId,
    role: "USER",
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  return await sign(payload, env.ACCESS_SECRET);
};

export const signRefreshToken = async (userId: string) => {
  const payload: TokenPayloadType = {
    sub: userId,
    role: "REFRESH",
    exp: Date.now() / 1000 + 60 * 60 * 24 * 7,
  };
  return await sign(payload, env.REFRESH_SECRET);
};

export const verifyToken = async (
  token: string,
  secret: string
): Promise<TokenPayloadType | null> => {
  try {
    return (await verify(token, secret)) as TokenPayloadType;
  } catch {
    return null;
  }
};
