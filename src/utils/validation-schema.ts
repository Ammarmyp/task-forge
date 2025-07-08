import z from "zod";

export const NewUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  bio: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
