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

console.log('=== Swift patching completed ===');
