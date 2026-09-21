import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const outputPublicDir = path.join(rootDir, ".output", "public");

console.log("[prepare-gh-pages] Preparando arquivos estáticos para GitHub Pages...");

if (!fs.existsSync(outputPublicDir)) {
  console.error("[prepare-gh-pages] Diretório .output/public não encontrado. Execute npm run build primeiro.");
  process.exit(1);
}

// 1. Garantir CNAME sempre com shop7.malaca.com.br
fs.writeFileSync(path.join(rootDir, "CNAME"), "shop7.malaca.com.br\n", "utf8");
fs.writeFileSync(path.join(outputPublicDir, "CNAME"), "shop7.malaca.com.br\n", "utf8");

// 2. Criar .nojekyll na raiz e em .output/public para desabilitar Jekyll no GitHub Pages
fs.writeFileSync(path.join(rootDir, ".nojekyll"), "", "utf8");
fs.writeFileSync(path.join(outputPublicDir, ".nojekyll"), "", "utf8");

// 3. Copiar index.html para a raiz do repositório
if (fs.existsSync(path.join(outputPublicDir, "index.html"))) {
  fs.copyFileSync(
    path.join(outputPublicDir, "index.html"),
    path.join(rootDir, "index.html")
  );
  // 4. Copiar index.html para 404.html para suportar roteamento SPA no GitHub Pages
  fs.copyFileSync(
    path.join(outputPublicDir, "index.html"),
    path.join(rootDir, "404.html")
  );
  fs.copyFileSync(
    path.join(outputPublicDir, "index.html"),
    path.join(outputPublicDir, "404.html")
  );
  console.log("[prepare-gh-pages] index.html e 404.html gerados na raiz com sucesso!");
}

// 5. Copiar pastas estáticas compiladas para a raiz
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(path.join(outputPublicDir, "assets"), path.join(rootDir, "assets"));
copyDirRecursive(path.join(outputPublicDir, "auth"), path.join(rootDir, "auth"));
copyDirRecursive(path.join(outputPublicDir, "minha-conta"), path.join(rootDir, "minha-conta"));
copyDirRecursive(path.join(outputPublicDir, "moderacao"), path.join(rootDir, "moderacao"));

console.log("[prepare-gh-pages] Assets e rotas copiados com sucesso para a raiz do branch gh-pages!");
