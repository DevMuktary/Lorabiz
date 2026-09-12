const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(p));
    } else if (file.endsWith('.swift')) {
      results.push(p);
    }
  });
  return results;
}

// 1. Patch Package.swift to swift-tools-version: 6.0 for Xcode 16.4 compatibility
const pkgPath = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Package.swift');
if (fs.existsSync(pkgPath)) {
  let c = fs.readFileSync(pkgPath, 'utf8');
  c = c.replace(/swift-tools-version: 6\.2/g, 'swift-tools-version: 6.0');
  fs.writeFileSync(pkgPath, c);
  console.log('[patch] Patched Package.swift to 6.0');
}

// 2. Patch weak let to weak var for Swift 6.1 compatibility
const sourcesDir = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Sources');
if (fs.existsSync(sourcesDir)) {
  const files = walk(sourcesDir);
  let count = 0;
  files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes('weak let')) {
      c = c.replace(/weak let/g, 'weak var');
      fs.writeFileSync(f, c);
      count++;
    }
  });
  console.log(`[patch] Replaced weak let with weak var in ${count} Swift files`);

  // 3. Patch trailing comma in JavaScriptRuntime.swift
  const rt = path.join(sourcesDir, 'ExpoModulesJSI/Runtime/JavaScriptRuntime.swift');
  if (fs.existsSync(rt)) {
    let c = fs.readFileSync(rt, 'utf8');
    c = c.replace('_ arguments: consuming JavaScriptValuesBuffer,', '_ arguments: consuming JavaScriptValuesBuffer');
    fs.writeFileSync(rt, c);
    console.log('[patch] Patched trailing comma in JavaScriptRuntime.swift');
  }
}
