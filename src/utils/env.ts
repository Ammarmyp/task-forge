export const env = {
  ACCESS_SECRET:
    process.env.ACCESS_SECRET ??
    (() => {
      throw new Error("Secret is not defined");
    })(),
  REFRESH_SECRET:
    process.env.REFRESH_SECRET ??
    (() => {
      throw new Error("Secret is not defined");
    })(),
};
