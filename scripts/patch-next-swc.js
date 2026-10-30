const fs = require('fs');
const path = require('path');

// Only needed on Android/Termux where prebuilt native SWC binaries are absent
if (process.platform !== 'android') {
  process.exit(0);
}

function findFiles(dir, filter, results = []) {
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!fullPath.includes('.git')) {
        findFiles(fullPath, filter, results);
      }
    } else if (filter(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

const swcFiles = findFiles(path.join(__dirname, '../node_modules'), (p) =>
  p.endsWith('next/dist/build/swc/index.js')
);

for (const filePath of swcFiles) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Fix loadWasm resolution
    if (
      content.includes('let bindings = await import((0, _url.pathToFileURL)(pkgPath).toString());')
    ) {
      content = content.replace(
        'let bindings = await import((0, _url.pathToFileURL)(pkgPath).toString());',
        `let resolvedPath = pkgPath;
   try { resolvedPath = require.resolve(pkgPath, { paths: [__dirname, process.cwd(), process.cwd() + '/apps/api'] }); } catch (e) {}
   let bindings = await import((0, _url.pathToFileURL)(resolvedPath).toString());`
      );
      modified = true;
    }

    // 2. Call tryLoadWasmWithFallback before logLoadFailure
    if (
      content.includes(
        'attempts = attempts.concat(a);\n        }\n        logLoadFailure(attempts, true);'
      )
    ) {
      content = content.replace(
        'attempts = attempts.concat(a);\n        }\n        logLoadFailure(attempts, true);',
        `attempts = attempts.concat(a);
        }
        let wasmFallback = await tryLoadWasmWithFallback(attempts);
        if (wasmFallback) {
            return resolve(wasmFallback);
        }
        logLoadFailure(attempts, true);`
      );
      modified = true;
    }

    // 3. Fallback in loadBindingsSync
    const syncTarget = 'if (wasmBindings) {\n        return wasmBindings;\n    }';
    if (content.includes(syncTarget) && !content.includes('require.resolve(\'@next/swc-wasm-nodejs\'')) {
      content = content.replace(
        syncTarget,
        `if (wasmBindings) {
        return wasmBindings;
    }
    try {
        const wasmPkg = require.resolve('@next/swc-wasm-nodejs', { paths: [__dirname, process.cwd(), process.cwd() + '/apps/api'] });
        const bindings = require(wasmPkg);
        wasmBindings = {
            isWasm: true,
            transform(src, options) { return bindings.transform ? bindings.transform(src.toString(), options) : Promise.resolve(bindings.transformSync(src.toString(), options)); },
            transformSync(src, options) { return bindings.transformSync(src.toString(), options); },
            minify(src, options) { return bindings.minify ? bindings.minify(src.toString(), options) : Promise.resolve(bindings.minifySync(src.toString(), options)); },
            minifySync(src, options) { return bindings.minifySync(src.toString(), options); },
            parse(src, options) { return bindings.parse ? bindings.parse(src.toString(), options) : Promise.resolve(bindings.parseSync(src.toString(), options)); },
            parseSync(src, options) { return bindings.parseSync(src.toString(), options); },
            getTargetTriple() { return undefined; },
            initCustomTraceSubscriber() {},
            teardownTraceSubscriber() {}
        };
        return wasmBindings;
    } catch (e) {}`
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`[patch-next-swc] Patched ${filePath}`);
    }
  } catch (err) {
    console.error(`[patch-next-swc] Error patching ${filePath}:`, err.message);
  }
}
