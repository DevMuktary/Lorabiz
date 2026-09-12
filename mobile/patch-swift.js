const fs = require('fs');
const path = require('path');

console.log('=== Patching Expo Swift Package files for Swift 6.0 (Xcode 16) ===');

// 1. Patch expo-modules-jsi/apple/Package.swift
const jsiFile = path.join(__dirname, 'node_modules', 'expo-modules-jsi', 'apple', 'Package.swift');
if (fs.existsSync(jsiFile)) {
  let content = fs.readFileSync(jsiFile, 'utf8');

  // Change tools version from 6.2 to 6.0
  content = content.replace('swift-tools-version: 6.2', 'swift-tools-version: 6.0');

  // Remove trailing commas before closing brackets and parentheses (illegal in Swift <= 6.0)
  content = content.replace(/\.macOS\("13\.4"\),/g, '.macOS("13.4")');
  content = content.replace(/targets: \["ExpoModulesJSI"\],/g, 'targets: ["ExpoModulesJSI"]');
  content = content.replace(/"-Xcc", apiNotesPath,/g, '"-Xcc", apiNotesPath');
  content = content.replace(/"-Xlinker", "dynamic_lookup",/g, '"-Xlinker", "dynamic_lookup"');
  content = content.replace(/\.unsafeFlags\(cxxIncludeFlags\),/g, '.unsafeFlags(cxxIncludeFlags)');
  content = content.replace(/path: "Tests",/g, 'path: "Tests"');
  content = content.replace(/path: "Benchmarks",/g, 'path: "Benchmarks"');

  // Universal cleanup: Any line ending with comma followed by a line starting with )
  // Example: "      ]," followed by "    ),"
  const lines = content.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const trimmedNext = lines[i + 1].trim();
    if (trimmedNext.startsWith(')') && lines[i].trim().endsWith(',')) {
      const idx = lines[i].lastIndexOf(',');
      lines[i] = lines[i].substring(0, idx) + lines[i].substring(idx + 1);
    }
  }
  content = lines.join('\n');

  // Remove upcoming features that require Swift 6.1+
  content = content.replace(/\s*\.enableUpcomingFeature\("NonisolatedNonsendingByDefault"\),?/g, '');
  content = content.replace(/\s*\.enableUpcomingFeature\("InferIsolatedConformances"\),?/g, '');

  fs.writeFileSync(jsiFile, content, 'utf8');
  console.log('Successfully patched ExpoModulesJSI Package.swift');
} else {
  console.log('expo-modules-jsi Package.swift not found at', jsiFile);
}

// 2. Patch @expo/expo-modules-macros-plugin/apple/Package.swift
const macroFile = path.join(__dirname, 'node_modules', '@expo', 'expo-modules-macros-plugin', 'apple', 'Package.swift');
if (fs.existsSync(macroFile)) {
  let content = fs.readFileSync(macroFile, 'utf8');
  content = content.replace('swift-tools-version: 6.2', 'swift-tools-version: 6.0');
  content = content.replace('602.0.0-latest', '600.0.0');
  fs.writeFileSync(macroFile, content, 'utf8');
  console.log('Successfully patched ExpoModulesMacros Package.swift');
} else {
  console.log('ExpoModulesMacros Package.swift not found at', macroFile);
}

// 3. Patch RuntimeScheduler.h (fix SWIFT_RETURNS_RETAINED for Swift 6.0 in Xcode 16)
const schedulerFile = path.join(__dirname, 'node_modules', 'expo-modules-jsi', 'apple', 'Sources', 'ExpoModulesJSI-Cxx', 'include', 'RuntimeScheduler.h');
if (fs.existsSync(schedulerFile)) {
  let content = fs.readFileSync(schedulerFile, 'utf8');
  content = content.replace(/SWIFT_RETURNS_RETAINED\s+/g, '');
  content = content.replace('#include <swift/bridging>', '#include <swift/bridging>\n\n#ifndef SWIFT_RETURNS_RETAINED\n#define SWIFT_RETURNS_RETAINED\n#endif');
  fs.writeFileSync(schedulerFile, content, 'utf8');
  console.log('Successfully patched RuntimeScheduler.h for Swift 6.0 compatibility');
} else {
  console.log('RuntimeScheduler.h not found at', schedulerFile);
}

console.log('=== Swift patching completed ===');
