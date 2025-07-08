import { Hono } from "hono";
import { serve } from "@hono/node-server";
import "dotenv/config";
import Routes from "./routes";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono! task forge running using it porperly");
});

app.route("/auth", Routes.userAuthRoutes);

serve(app);

export default app;
