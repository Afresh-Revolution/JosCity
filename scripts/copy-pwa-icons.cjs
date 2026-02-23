const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcLogo = path.join(root, "src", "image", "primary-logo.png");
const publicDir = path.join(root, "public");

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (fs.existsSync(srcLogo)) {
  fs.copyFileSync(srcLogo, path.join(publicDir, "icon-192.png"));
  fs.copyFileSync(srcLogo, path.join(publicDir, "icon-512.png"));
  console.log("PWA icons copied from primary-logo.png to public/");
} else {
  console.warn("primary-logo.png not found; add icon-192.png and icon-512.png to public/ for PWA");
}
