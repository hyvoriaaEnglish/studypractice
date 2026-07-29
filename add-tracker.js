const fs = require("fs");
const path = require("path");

// ==========================================
// CÁC FILE KHÔNG CẦN TRACKER
// ==========================================

const excludedFiles = [
  "account.html",
  "login.html",
  "register.html",
  "trangchu.html",
  "index.html",
];

// ==========================================
// LẤY THƯ MỤC HIỆN TẠI
// ==========================================

const rootFolder = __dirname;

// ==========================================
// TÌM TẤT CẢ FILE HTML
// ==========================================

function getAllHtmlFiles(folder) {
  let results = [];

  const files = fs.readdirSync(folder);

  for (const file of files) {
    const fullPath = path.join(folder, file);

    const stat = fs.statSync(fullPath);

    // Nếu là thư mục
    if (stat.isDirectory()) {
      // Bỏ qua các thư mục này
      if (file === "node_modules" || file === ".git" || file === ".netlify") {
        continue;
      }

      results = results.concat(getAllHtmlFiles(fullPath));
    }

    // Nếu là file HTML
    else if (file.toLowerCase().endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

// ==========================================
// CHẠY
// ==========================================

const htmlFiles = getAllHtmlFiles(rootFolder);

console.log(`Found ${htmlFiles.length} HTML files.`);

let updatedCount = 0;

for (const filePath of htmlFiles) {
  const fileName = path.basename(filePath);

  // Bỏ qua file không cần tracker

  if (excludedFiles.includes(fileName)) {
    console.log("Skipped:", fileName);

    continue;
  }

  let html = fs.readFileSync(filePath, "utf8");

  // Nếu đã có tracker thì bỏ qua

  if (html.includes("study-tracker.js")) {
    console.log("Already added:", filePath);

    continue;
  }

  // Kiểm tra có </body> không

  if (html.includes("</body>")) {
    html = html.replace(
      "</body>",
      `
<script src="/study-tracker.js"></script>

</body>`,
    );
  } else {
    html += `

<script src="/study-tracker.js"></script>
`;
  }

  // Lưu file

  fs.writeFileSync(filePath, html, "utf8");

  console.log("Updated:", filePath);

  updatedCount++;
}

console.log("\n================================");

console.log(`Done! Updated ${updatedCount} files.`);

console.log("================================");
