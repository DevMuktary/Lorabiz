# Lorabiz Mobile Application — Brand Identity & Welcome Flow Walkthrough

The visual identity and pre-login onboarding experience have been elevated to match the standard of **ALAT by Wema**, with a native GPU-accelerated circular reveal, signature brand pink app icon, 3D fintech hero scene, and a dedicated Welcome landing screen.

---

## 1. What Was Implemented

### A. App Icon & Splash Visuals
* **Icon Design (`mobile/assets/icon.png` & `android-icon-foreground.png`)**:
  * Solid signature **Lorabiz Brand Pink** (`#E11D48` / `#C82D75`) background.
  * Crisp **White Lorabiz icon mark** centered with no background box.
  * Generated at standard 1024x1024 resolution with safe-zone padding for iOS and Android.
* **Native Splash Config (`mobile/app.json`)**:
  * Set `splash.backgroundColor` to `#E11D48`.
  * Set `splash.image` to `./assets/splash-icon.png`.

---

### B. ALAT-Style Circular Zoom Reveal Animation (`mobile/app/index.tsx`)
* **100% Native Code (GPU-Accelerated)**:
  * Runs directly on the native UI thread via React Native's `Animated` API with `useNativeDriver: true`.
  * Silky-smooth **120Hz / 60fps** without any video buffer delay or battery drain.
* **Animation Sequence**:
  1. Opens with full-screen signature brand pink canvas.
  2. Centered white circle smoothly emerges with the Lorabiz logo mark.
  3. The white circle zooms out (`scale: 24x`), expanding outward across the entire screen.
  4. Once enveloped, smoothly hands off to the Welcome Screen with zero jump or flicker.
  5. Returning users with an active session token seamlessly bypass to the dashboard.

---

### C. ALAT-Inspired Welcome Landing Screen (`mobile/app/(auth)/welcome.tsx`)
* **Layout & Content**:
  1. **Top Header**: Official Lorabiz logo mark with safe-area spacing.
  2. **Hero Centerpiece**: Bespoke 3D fintech artwork card featuring a metallic pink Lorabiz card, smartphone wallet mockup, and polished marble podiums, overlaid with an *"Instant Slips & Bills"* badge.
  3. **Primary CTA**: **`Get Started`** button (solid brand pink, white text) $\rightarrow$ routes to `/(auth)/register`.
  4. **Secondary CTA**: **`Log in`** button (solid white, brand pink text) $\rightarrow$ routes to `/(auth)/login`.
  5. **Trust Footnote**: *"Licensed Business & Identity Infrastructure"*.
  6. **App Version**: Bold **`v1.0.0`** centered at the bottom.

---

### D. Light Mode Theme Default (`mobile/constants/theme.ts`)
* **Default Canvas**: Clean, crisp Light Mode (`#FFFFFF` background, `#F8FAFC` elevated cards, `#0F172A` deep charcoal typography, `#C82D75` brand pink accents).
* Retains dark theme tokens so users can toggle between Light, Dark, and System modes in Settings.

---

### E. Navigation Integration (`mobile/app/(auth)/_layout.tsx` & `login.tsx`)
* Registered `welcome` screen in `AuthLayout` stack.
* Added top back arrow in `login.tsx` allowing effortless navigation back to the Welcome screen.
* Updated login brand header to use `logo-pink.png`.

---

## 2. Active Cloud Build on GitHub Actions

| Parameter | Details |
| :--- | :--- |
| **Workflow Run** | [Build Mobile Apps (iOS IPA) #34719863894](https://github.com/DevMuktary/Lorabiz/actions/runs/34719863894) |
| **Commit** | [`2c67a265`](https://github.com/DevMuktary/Lorabiz/commit/2c67a265) |
| **Branch** | `Mobile-app` |
| **Build Status** | **SUCCESS** :white_check_mark: |
| **Artifact** | [Lorabiz-iOS-Sideloadly-IPA (11.4 MB)](https://github.com/DevMuktary/Lorabiz/actions/runs/34719863894/artifacts/10305624859) |

---

## 3. How to Install on iPhone via Sideloadly

1. Once the GitHub Actions run finishes, download **`Lorabiz-iOS-Sideloadly-IPA`** from the run summary.
2. Unzip the downloaded file to get `Lorabiz.ipa`.
3. Open **Sideloadly** on your computer and connect your iPhone with a USB cable.
4. Drag and drop `Lorabiz.ipa` into the Sideloadly window.
5. Enter your Apple ID and click **Start**.
6. Once installed:
   - On your iPhone, go to **Settings → General → VPN & Device Management**.
   - Tap your Apple ID under **Developer App** and tap **Trust**.
7. Launch **Lorabiz**:
   - The brand pink splash screen appears.
   - The white circle smoothly zooms out to reveal the white canvas.
   - The Welcome screen loads with the 3D fintech hero scene, "Get Started", "Log in", and `v1.0.0`!
