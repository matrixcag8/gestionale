import fs from "fs";
import path from "path";

const root = process.cwd();
const targetDir = path.join(root, "node_modules", ".prisma");
const linkPath = path.join(root, "node_modules", "@prisma", "client", ".prisma");

if (!fs.existsSync(targetDir)) {
  console.warn("[prisma-link] Skipped: node_modules/.prisma not found");
  process.exit(0);
}

try {
  if (fs.existsSync(linkPath)) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      process.exit(0);
    }
    fs.rmSync(linkPath, { recursive: true, force: true });
  }

  fs.symlinkSync("../.prisma", linkPath, "dir");
  console.log("[prisma-link] Linked @prisma/client/.prisma -> ../.prisma");
} catch (error) {
  console.warn("[prisma-link] Unable to create symlink:", error?.message || error);
  process.exit(0);
}
