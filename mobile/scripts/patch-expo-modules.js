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

const sourcesDir = path.join(__dirname, '../node_modules/expo-modules-jsi/apple/Sources');

// 2. Patch Swift files for Swift 6.1 strict concurrency & syntax
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

  // 3. Patch Task+immediate.swift for Swift 6.1 (removes OS 26 Task.immediate check)
  const taskImmediate = path.join(sourcesDir, 'ExpoModulesJSI/Extensions/Task+immediate.swift');
  if (fs.existsSync(taskImmediate)) {
    let c = fs.readFileSync(taskImmediate, 'utf8');
    c = c.replace(/if #available[\s\S]*?else \{[\s\S]*?\n    \}/, 'return Task(priority: priority ?? .high, operation: operation)');
    fs.writeFileSync(taskImmediate, c);
    console.log('[patch] Patched Task+immediate.swift for Swift 6.1');
  }

  // 4. Patch HostFunctionClosure.h for Swift 6.1 interop
  const hfcPath = path.join(sourcesDir, 'ExpoModulesJSI-Cxx/include/HostFunctionClosure.h');
  if (fs.existsSync(hfcPath)) {
    let c = fs.readFileSync(hfcPath, 'utf8');
    c = c.replace('explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator)', 'explicit HostFunctionClosure(Context context, Closure *closure, Deallocator deallocator)');
    if (!c.includes('createHostFunctionClosure')) {
      c = c.replace(
        '} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure',
        `} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure\n\ninline HostFunctionClosure *createHostFunctionClosure(RetainedSwiftPointer::Context context, HostFunctionClosure::Closure *closure, RetainedSwiftPointer::Deallocator deallocator) {\n  return new HostFunctionClosure(context, closure, deallocator);\n}`
      );
    }
    fs.writeFileSync(hfcPath, c);
    console.log('[patch] Patched HostFunctionClosure.h for Swift 6.1 interop');
  }

  // 5. Patch RuntimeScheduler.h for Swift 6.1 interop
  const rsPath = path.join(sourcesDir, 'ExpoModulesJSI-Cxx/include/RuntimeScheduler.h');
  const patchRs = path.join(__dirname, '../patches/RuntimeScheduler.h');
  if (fs.existsSync(patchRs) && fs.existsSync(rsPath)) {
    fs.copyFileSync(patchRs, rsPath);
    console.log('[patch] Copied patches/RuntimeScheduler.h into node_modules');
  }

  // 6. Patch JavaScriptRuntime.swift (trailing comma, consuming label, and factory calls)
  const rt = path.join(sourcesDir, 'ExpoModulesJSI/Runtime/JavaScriptRuntime.swift');
  if (fs.existsSync(rt)) {
    let c = fs.readFileSync(rt, 'utf8');
    c = c.replace('_ arguments: consuming JavaScriptValuesBuffer,', '_ arguments: consuming JavaScriptValuesBuffer');
    c = c.replace('vector.push_back(consuming: propNameId)', 'vector.push_back(propNameId)');
    c = c.replace(/expo\.RuntimeScheduler\(\)/g, 'expo.createRuntimeScheduler()');
    c = c.replace(/expo\.RuntimeScheduler\(scheduler, fn\)/g, 'expo.createRuntimeScheduler(scheduler, fn)');
    c = c.replace(/expo\.HostFunctionClosure\(context, call, deallocate\)/g, 'expo.createHostFunctionClosure(context, call, deallocate)');
    fs.writeFileSync(rt, c);
    console.log('[patch] Patched JavaScriptRuntime.swift syntax and factory calls');
  }
}
