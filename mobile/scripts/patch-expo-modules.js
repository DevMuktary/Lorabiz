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
  c = c.replace(/swift-tools-version: 6\.[0-9]+/g, 'swift-tools-version: 6.0');
  fs.writeFileSync(pkgPath, c);
  console.log('[patch] Patched Package.swift to 6.0');
}

// 2. Patch Swift files for Swift 6.1 strict concurrency & syntax
const sourcesDir = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Sources');
if (fs.existsSync(sourcesDir)) {
  const files = walk(sourcesDir);
  let count = 0;
  files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let modified = false;

    // Replace weak runtime properties with nonisolated(unsafe) weak var so Sendable classes don't trigger mutable stored property errors
    if (c.includes('weak let runtime') || c.includes('weak var runtime')) {
      c = c.replace(/private\s+weak\s+(?:let|var)\s+runtime:/g, 'nonisolated(unsafe) private weak var runtime:');
      c = c.replace(/internal\s+weak\s+(?:let|var)\s+runtime:/g, 'nonisolated(unsafe) internal weak var runtime:');
      modified = true;
    }

    // Replace any remaining weak let with weak var (Swift 6.1 requirement)
    if (c.includes('weak let')) {
      c = c.replace(/weak let/g, 'weak var');
      modified = true;
    }

    // Mark Sendable classes with weak properties as @unchecked Sendable
    if (f.endsWith('JavaScriptPropNameID.swift') && c.includes('class JavaScriptPropNameID: JavaScriptType')) {
      c = c.replace('class JavaScriptPropNameID: JavaScriptType', 'class JavaScriptPropNameID: @unchecked Sendable, JavaScriptType');
      modified = true;
    }
    if (f.endsWith('JavaScriptError.swift') && c.includes('class JavaScriptError: Error, Sendable')) {
      c = c.replace('class JavaScriptError: Error, Sendable', 'class JavaScriptError: Error, @unchecked Sendable');
      modified = true;
    }
    if (f.endsWith('JavaScriptValue.swift') && c.includes('class JavaScriptValue: JavaScriptType')) {
      c = c.replace('class JavaScriptValue: JavaScriptType', 'class JavaScriptValue: @unchecked Sendable, JavaScriptType');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(f, c);
      count++;
    }
  });
  console.log(`[patch] Patched ${count} Swift files for Swift 6.1 Sendable concurrency`);

  // 3. Patch trailing comma in JavaScriptRuntime.swift
  const rt = path.join(sourcesDir, 'ExpoModulesJSI/Runtime/JavaScriptRuntime.swift');
  if (fs.existsSync(rt)) {
    let c = fs.readFileSync(rt, 'utf8');
    c = c.replace('_ arguments: consuming JavaScriptValuesBuffer,', '_ arguments: consuming JavaScriptValuesBuffer');
    fs.writeFileSync(rt, c);
    console.log('[patch] Patched trailing comma in JavaScriptRuntime.swift');
  }
}
