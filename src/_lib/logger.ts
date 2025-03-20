import { APIError } from "./Error";

export const DevLog = (
  content: Error | APIError | string,
  type: "error" | "warn" | "debug" = "debug",
) => {
  const message = typeof content === "object" ? content instanceof APIError ? content.message : content instanceof Error ? content.message : content : content;
  if (type === "error" && (content instanceof APIError || content instanceof Error))
    console.error(`\x1b[31m[ ${type} ] ${message} \x1b[0m`, content);
  else if (type === "error")
    console.log(`\x1b[31m[ ${type} ] ${message} \x1b[0m`);
  if (type === "warn") console.log(`\x1b[33m[ ${type} ] ${message} \x1b[0m`);
  if (type === "debug") console.log(`\x1b[32m[ ${type} ] ${message} \x1b[0m`);
};
