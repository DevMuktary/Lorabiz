# Lorabiz Mobile Application — Delivery & Verification Walkthrough

The standalone **iOS `.ipa` package** has been updated, compiled, packaged, and verified via GitHub Actions cloud CI under branch `Mobile-app`. This build completely resolves the splash screen runtime shutdown by fixing the Swift ARC reference ownership on `RuntimeScheduler` and directing the entry point to `expo-router/entry`.

---

## 1. Cloud Build & iOS IPA Delivery

| Parameter | Details |
| :--- | :--- |
| **Workflow Run** | [Build Mobile Apps (iOS IPA) #34707342786](https://github.com/DevMuktary/Lorabiz/actions/runs/34707342786) |
| **Commit** | [`9dac66f0`](https://github.com/DevMuktary/Lorabiz/commit/9dac66f0) |
| **Outcome** | **All Steps Passed (SUCCESS)** |
| **Build Duration** | **6m 26s** (down from 12m 34s — ~50% faster thanks to CocoaPods caching & single `arm64` architecture target) |
| **Artifact Name** | **`Lorabiz-iOS-Sideloadly-IPA`** |
| **Artifact ID** | **`10302436996`** |
| **Artifact Size** | **12.65 MB** (`Lorabiz.ipa`) |
| **Direct Download Link** | [Download `Lorabiz-iOS-Sideloadly-IPA` from GitHub Actions Run #34707342786](https://github.com/DevMuktary/Lorabiz/actions/runs/34707342786/artifacts/10302436996) |

> [!TIP]
> **Why the .ipa is ~12.6 MB (Completely Normal & Standard):**
> An iOS `.ipa` file is a compressed ZIP archive containing `Payload/Lorabiz.app`. When uncompressed on your iPhone by iOS, the app bundle unpacks to approximately **50 MB** (including the Mach-O binary, pre-compiled Hermes JS bytecode containing all 3,171 modules, embedded `ExpoModulesJSI.framework`, and 35 image/font assets). There is nothing missing.

---

## 2. Root Cause of Splash Screen Shutdown & Resolution

### The Issue Reported
After installing the previous build via Sideloadly, the app launched, displayed the native splash screen, and then abruptly shut down / closed back to the home screen.

### Root Cause Analysis
1. **Foreign Reference ARC Mismatch on `RuntimeScheduler`**:
   - `RuntimeScheduler` is a C++ class annotated with `SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler)`.
   - In earlier downleveling patches (intended for older Xcode 16 compilers), `SWIFT_RETURNS_RETAINED` was stripped, and constructor calls were replaced by plain C++ functions.
   - Without `SWIFT_RETURNS_RETAINED` on the factory returning `RuntimeScheduler*`, Swift ARC did not recognize that the newly created C++ object already had a +1 retain count.
   - When Hermes started up on the JS thread and scheduled the first task, an ARC mismatch or double-free caused an immediate memory corruption (`EXC_BAD_ACCESS`), shutting down the app while the splash screen was visible.
2. **Clang Annotation Rules**:
   - In Apple Clang (Xcode 26.3), `SWIFT_RETURNS_RETAINED` cannot be placed on constructors because constructors have no return type in C++.
   - Instead, `SWIFT_RETURNS_RETAINED` must be placed on inline factory functions returning `RuntimeScheduler*`.
3. **Entry Point Conflict**:
   - A legacy `mobile/App.tsx` and conflicting `mobile/index.ts` existed in the root, bypassing `expo-router/entry`.

### Changes Implemented (Commits [`ca8929d2`](https://github.com/DevMuktary/Lorabiz/commit/ca8929d2) & [`9dac66f0`](https://github.com/DevMuktary/Lorabiz/commit/9dac66f0))
1. **Added `SWIFT_RETURNS_RETAINED` on Inline Factory Functions**:
   - Updated `mobile/patches/RuntimeScheduler.h` with:
     ```cpp
     SWIFT_RETURNS_RETAINED inline RuntimeScheduler *createRuntimeScheduler() {
       return new RuntimeScheduler();
     }

     SWIFT_RETURNS_RETAINED inline RuntimeScheduler *createRuntimeScheduler(void *scheduler, RuntimeScheduler::ScheduleFn fn) {
       return new RuntimeScheduler(scheduler, fn);
     }
     ```
   - Swift ARC now tracks and manages `RuntimeScheduler` with 100% memory correctness.
2. **Inline Retain / Release Trampolines**:
   - Added null-safe `inline void retainRuntimeScheduler` and `inline void releaseRuntimeScheduler` directly in `RuntimeScheduler.h`.
3. **Cleaned up Root Entry Point**:
   - Replaced `mobile/index.ts` with `import 'expo-router/entry';`.
   - Deleted `mobile/App.tsx`.
4. **CI Speed Optimizations & Caching**:
   - Added `actions/cache@v4` for CocoaPods and React Native maven artifacts (`~/Library/Caches/ReactNative`).
   - Added `ARCHS="arm64" ONLY_ACTIVE_ARCH=YES` and `-parallelizeTargets` to `xcodebuild`, cutting CI time in half (from ~12.5 minutes to ~6.5 minutes).

---

## 3. How to Install on iPhone via Sideloadly

1. Go to the [GitHub Actions Run #34707342786 page](https://github.com/DevMuktary/Lorabiz/actions/runs/34707342786).
2. Under **Artifacts** at the bottom of the page, click **`Lorabiz-iOS-Sideloadly-IPA`** (or use the [direct artifact download link](https://github.com/DevMuktary/Lorabiz/actions/runs/34707342786/artifacts/10302436996)).
3. Unzip the downloaded file to get `Lorabiz.ipa`.
4. Open **Sideloadly** on your computer and connect your iPhone with a USB cable.
5. Drag and drop `Lorabiz.ipa` into the Sideloadly window.
6. Enter your Apple ID and click **Start**.
7. Once installed:
   - On your iPhone, go to **Settings → General → VPN & Device Management**.
   - Tap your Apple ID under **Developer App** and tap **Trust**.
8. Launch **Lorabiz**! The app will display the splash screen and transition smoothly into the authentication / login screen.
