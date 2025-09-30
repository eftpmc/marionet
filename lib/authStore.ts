import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const authFile = path.join(process.cwd(), "data", "auth.json");

function ensureAuthFile() {
  if (!fs.existsSync(path.dirname(authFile))) {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
  }

  if (!fs.existsSync(authFile)) {
    const defaultHash = bcrypt.hashSync("1234", 10); // default password
    fs.writeFileSync(
      authFile,
      JSON.stringify({ username: "test", passwordHash: defaultHash }, null, 2)
    );
  }
}

export function readAuth() {
  ensureAuthFile();
  return JSON.parse(fs.readFileSync(authFile, "utf-8"));
}

export function saveAuth(username: string, passwordHash: string) {
  ensureAuthFile();
  fs.writeFileSync(authFile, JSON.stringify({ username, passwordHash }, null, 2));
}