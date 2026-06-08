import fs from "fs";

async function fetchCode() {
  const res = await fetch("https://raw.githubusercontent.com/FoolVPN-ID/Nautica/main/_worker.js");
  const text = await res.text();
  fs.writeFileSync("nautica.js", text);
}
fetchCode();
