// Runs the API server (with reload on change) and the Vite dev server together.
// `node scripts/dev.mjs --server-only` runs just the API server.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

// Node's --watch crashes if an --env-file target is missing, so only pass it when .env exists.
const envArgs = existsSync(".env") ? ["--env-file=.env"] : [];
const procs = [spawn("node", [...envArgs, "--watch", "server/index.ts"], { stdio: "inherit" })];
// On Windows, npx is a .cmd script and must be launched through a shell.
if (!process.argv.includes("--server-only")) procs.push(spawn("npx", ["vite"], { stdio: "inherit", shell: process.platform === "win32" }));

const stop = () => { procs.forEach((p) => p.kill()); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
