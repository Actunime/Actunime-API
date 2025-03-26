import { config } from "@actunime/eslint-config/base";
import test from "@actunime/typescript-config"

/** @type {import("eslint").Linter.Config} */
export default [
    ...config,
    {
        "files": ["tests/**/*"],
        "env": {
            "jest": true
        }
    }
]