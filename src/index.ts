import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono! task forge running");
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  () => {
    console.log("task forge running");
  }
);

export default app;
