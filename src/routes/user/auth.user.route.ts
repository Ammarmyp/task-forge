import { Hono } from "hono";
import { login, signup } from "../../controllers/auth/auth.controller";

const authRoutes = new Hono();

authRoutes.post("/register", signup);
authRoutes.post("/login", login);

export default authRoutes;
