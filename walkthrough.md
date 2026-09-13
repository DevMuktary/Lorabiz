# Lorabiz Mobile Application — Splash & Onboarding Architecture Walkthrough

The splash reveal and onboarding experience have been refined to eliminate all freezes, delays, and white flashes, delivering a continuous native GPU-driven animation that transitions directly into the 3D Welcome screen.

---

## 1. What Was Fixed & Implemented

### A. Splash Screen: Zero-Freeze Continuous Animation (`mobile/app/index.tsx`)
* **Problem**: The previous iteration paused the circle for 1.8 seconds before zooming out, causing an unnatural freeze, and then rapidly scaled to 24x turning the screen white.
* **Solution**:
  1. **Continuous 3.6s Expansion**: Removed all intermediate pauses. The circle badge starts compact (`scale: 0.15` ~ 48px) and continuously expands over **3600ms** (`Easing.bezier(0.25, 0.1, 0.25, 1)`).
  2. **Synchronous Logo Tracking**: The Lorabiz brand mark scales smoothly alongside the expanding circle from `0.18` to `1.25`, gently dissolving as the circle envelops the viewport.

---

### B. Welcome Screen: Zero-Flash Pre-Rendered Architecture (`mobile/components/WelcomeView.tsx` & `mobile/app/index.tsx`)
* **Problem**: Calling `router.replace("/(auth)/welcome")` caused an unmount/mount route transition in React Native Screens, leaving the device on a blank white screen (`#FFFFFF`) for 250–400ms while loading the 3D asset.
* **Solution**:
  1. **Base Layer Rendering**: `<WelcomeView />` is rendered directly as the base layer of `index.tsx`. The full-bleed 3D architectural scene (`welcome-hero.jpg`), brand logo, and action buttons are pre-decoded in GPU memory from launch.
  2. **Smooth Overlay Dissolve**: At `t = 2700ms` through `t = 3600ms` (900ms dissolve window), the pink splash canvas smoothly fades its opacity (`1.0 -> 0.0`), revealing the pre-rendered Welcome screen with **zero white screen flash**.
  3. **Unmount on Finish**: At `t = 3600ms`, `setShowSplash(false)` unmounts the overlay to free all CPU/GPU resources.
  4. **Direct Navigation**:
     * **"Get Started"** $\rightarrow$ `router.push("/(auth)/register")`
     * **"Log in"** $\rightarrow$ `router.push("/(auth)/login")`
     * Returning from Login or Register preserves the Welcome Screen state without re-triggering the splash animation.

---

### C. Authentication Screens: iOS Dynamic Island Safe-Area Alignment (`login.tsx` & `register.tsx`)
* Integrated `useSafeAreaInsets` on both `login.tsx` and `register.tsx`.
* Replaced hardcoded `paddingTop: 50` with dynamic safe-area insets (`Math.max(insets.top, 20) + 10`).
* Back navigation buttons and brand headers now sit comfortably below the physical status bar and Dynamic Island on all iPhone models.

---

## 2. CI/CD Build Information

| Item | Details |
| :--- | :--- |
| **Workflow Run** | [Build Mobile Apps (iOS IPA) #34730761367](https://github.com/DevMuktary/Lorabiz/actions/runs/34730761367) |
| **Commit** | [`38200c4b`](https://github.com/DevMuktary/Lorabiz/commit/38200c4b) — *feat(mobile): eliminate splash freeze and white flash with continuous 3.6s circle expansion and seamless welcome dissolve* |
| **Build Status** | **Completed & Succeeded** (All steps green) |
| **Artifact** | **`Lorabiz-iOS-Sideloadly-IPA`** (ID: `10309960099`, Size: ~12.1 MB) |
| **Download Page** | [GitHub Actions Run #34730761367 Artifacts](https://github.com/DevMuktary/Lorabiz/actions/runs/34730761367) |
