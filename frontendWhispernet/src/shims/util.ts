export const inspect = (value: unknown) => {
  try {
    return typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const debuglog = () => () => {};

export default {
  inspect,
  debuglog,
};

