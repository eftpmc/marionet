// save-cookies.js
// Node 18+ recommended
import fs from "fs";
import path from "path";
import minimist from "minimist";
import readline from "readline";
import { connect } from "puppeteer-real-browser";

async function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ["url", "out"],
    boolean: ["auto"],
    default: { url: "", out: "cookies.json", auto: false },
  });

  let url = argv.url;
  if (!url) {
    url = await ask("Enter the target URL: ");
  }

  const out = path.resolve(process.cwd(), argv.out);
  const auto = !!argv.auto;

  console.log("Launching browser (headed). Please log in to the target site.");
  console.log("Target URL:", url);
  console.log("Cookies will be saved to:", out);
  console.log("");

  const { browser, page } = await connect({
    headless: false,
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
  });

  await page.goto(url, { waitUntil: "networkidle2" });

  if (auto) {
    const waitMs = 60000; // default 60s
    console.log(`Waiting ${waitMs / 1000}s and then saving cookies automatically...`);
    await new Promise((r) => setTimeout(r, waitMs));
  } else {
    console.log("When you have finished logging in, press ENTER to save cookies and exit.");
    await new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.once("data", () => {
        process.stdin.pause();
        resolve();
      });
    });
  }

  const cookies = await page.cookies();
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(cookies, null, 2), { encoding: "utf8" });

  console.log(`Cookies saved to ${out} — please upload this file to the app or copy it as needed.`);

  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});