import { spawnSync } from "node:child_process";

const env = { ...process.env, APP_BASE_PATH: "/nuevasnutrias", NEXT_PUBLIC_BASE_PATH: "/nuevasnutrias" };
const result = spawnSync(process.execPath, ["scripts/run-framework.mjs", "build"], { stdio: "inherit", env });
process.exit(result.status ?? 1);
