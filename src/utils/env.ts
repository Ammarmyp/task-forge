export const env = {
  SECRET:
    process.env.SECRET ??
    (() => {
      throw new Error("Secret is not defined");
    })(),
};
