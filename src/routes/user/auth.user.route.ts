import { Hono } from "hono";
import {
  login,
  refreshHandler,
  signup,
} from "../../controllers/auth/auth.controller";

const authRoutes = new Hono();

authRoutes.post("/register", signup);
authRoutes.post("/login", login);
authRoutes.get("/refresh", refreshHandler);

export default authRoutes;
