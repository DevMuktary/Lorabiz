"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Fixes the mismatched blocks iOS Safari draws in the phone status bar and its own
 * bottom toolbar whenever a modal is open.
 *
 * What actually causes it (measured on-device, not guessed): Safari tints its chrome
 * from the topmost full-screen layer on the page, and it **discards that layer's
 * alpha**. A scrim of `bg-black/50` over a light page should read as mid-grey, but
 * Safari takes the `rgb` and throws the `/50` away, so both bars go solid black while
 * the page stays light. An opaque scrim tints them correctly; a translucent or
 * `backdrop-blur`ed one does not. `<meta name="theme-color">` does not override this.
 *
 * So the scrim is made genuinely opaque, filled with the exact colour it was already
 * compositing to. The screen looks the same, but now there is no alpha for Safari to
 * drop. Overlays are found generically, so no modal needs to know this exists.
 */

const META_ID = "app-theme-color";

/** An overlay only tints the browser chrome if it covers essentially the whole screen. */
const COVERAGE_RATIO = 0.9;

/** Overlays open/close rarely; this bounds the cost of the DOM observer below. */
const THROTTLE_MS = 100;

/**
 * Only iOS/iPadOS Safari has this behaviour, and the fix trades away the see-through
 * dimming, so it stays off everywhere else. iPadOS reports itself as a Mac, hence the
 * touch-point check.
 */
function isIOS(): boolean {
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

type Scrim = { el: HTMLElement; color: string; alpha: number };

/**
 * Whatever a scrim looked like before we touched it. Compositing must always start
 * from these: read the live value instead and the opaque colour we wrote last time
 * becomes the input to the next pass, which is what freezes the bars on a stale
 * colour when the theme changes mid-modal.
 */
const original = new WeakMap<HTMLElement, string>();

function originalBackground(el: HTMLElement, style: CSSStyleDeclaration): string {
  let color = original.get(el);
  if (color === undefined) {
    color = style.backgroundColor;
    original.set(el, color);
  }
  return color;
}

/** Computed transparency is always this exact string, so no parsing is needed. */
function paintsNothing(color: string): boolean {
  return !color || color === "transparent" || color === "rgba(0, 0, 0, 0)";
}

/**
 * Every overlay in the app is a `fixed inset-0` scrim, so that class is a cheap and
 * accurate way to find them. Returned bottom-up in paint order.
 */
function collectScrims(): Scrim[] {
  // clientWidth/clientHeight excludes any scrollbar, so it matches what a
  // `position: fixed` element actually spans.
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (!vw || !vh) return [];

  const minArea = vw * vh * COVERAGE_RATIO;
  const found: { scrim: Scrim; z: number }[] = [];

  document.body
    .querySelectorAll<HTMLElement>('[class*="inset-0"]')
    .forEach((el) => {
      const style = getComputedStyle(el);
      if (style.position !== "fixed") return;
      if (style.display === "none" || style.visibility === "hidden") return;

      const alpha = Number(style.opacity);
      if (!alpha) return;

      // Clip to the viewport before measuring, so an overlay parked off-screen
      // (the closed mobile sidebar is translated out) doesn't count as covering.
      const rect = el.getBoundingClientRect();
      const w = Math.min(rect.right, vw) - Math.max(rect.left, 0);
      const h = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (w <= 0 || h <= 0 || w * h < minArea) return;

      found.push({
        scrim: { el, color: originalBackground(el, style), alpha: Math.min(alpha, 1) },
        z: Number(style.zIndex) || 0,
      });
    });

  // Stable sort keeps document order for equal z-index, matching paint order.
  return found.sort((a, b) => a.z - b.z).map((entry) => entry.scrim);
}

let canvas: CanvasRenderingContext2D | null | undefined;

/** Cached 1x1 surface used to let the browser do the alpha compositing for us. */
function getCanvas(): CanvasRenderingContext2D | null {
  if (canvas === undefined) {
    const el = document.createElement("canvas");
    el.width = 1;
    el.height = 1;
    canvas = el.getContext("2d", { willReadFrequently: true });
  }
  return canvas;
}

/** The colour the current stack of scrims is already producing on screen. */
function resolveOverlayColor(scrims: Scrim[]): string {
  const ctx = getCanvas();
  if (!ctx) return "";

  // Stacking the layers on a canvas rather than doing the math by hand means any
  // colour space the browser understands works — Tailwind v4 computes an opacity
  // modifier like `bg-black/60` to `oklab(0 0 0 / 0.6)`, not `rgba(...)`.
  ctx.clearRect(0, 0, 1, 1);
  ctx.globalAlpha = 1;

  // globals.css sets `html { background-color: hsl(var(--background)) }`, so this
  // tracks the live theme without duplicating the palette here.
  ctx.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);

  for (const { color, alpha } of scrims) {
    ctx.globalAlpha = alpha;
    // A value the canvas can't parse leaves fillStyle untouched, which would
    // re-apply the previous layer. Reset to fully transparent so a failed
    // assignment paints nothing instead.
    ctx.fillStyle = "#00000000";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  // Nothing opaque resolved (stylesheet not applied yet) — leave things alone.
  if (!a) return "";

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Makes the top scrim opaque in the colour the stack was already showing. Only the
 * top one needs it — the ones beneath are then invisible anyway, and an overlay that
 * paints nothing (the sidebar's tap-to-close layer) is left alone, since filling that
 * one in would hide the page it is deliberately transparent over.
 */
function sealTopScrim(scrims: Scrim[], color: string) {
  for (let i = scrims.length - 1; i >= 0; i--) {
    const { el } = scrims[i];
    if (paintsNothing(original.get(el) ?? "")) continue;

    if (el.style.backgroundColor !== color) el.style.backgroundColor = color;
    // Redundant once the layer is opaque: there is nothing behind it left to blur,
    // and on iOS the blur is the other half of what breaks the tinting.
    if (el.style.backdropFilter !== "none") {
      el.style.backdropFilter = "none";
      el.style.setProperty("-webkit-backdrop-filter", "none");
    }
    return;
  }
}

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.getElementById(META_ID) as HTMLMetaElement | null;

    // Nothing else should emit theme-color now; drop any stray tag so Safari can't
    // pick a competing one ahead of ours.
    document.querySelectorAll('meta[name="theme-color"]').forEach((tag) => {
      if (tag !== meta) tag.remove();
    });

    let timer = 0;
    let lastRun = 0;
    let lastColor = "";

    const run = () => {
      lastRun = Date.now();
      const scrims = collectScrims();
      const color = resolveOverlayColor(scrims);
      if (!color) return;

      // Still worth keeping current for Android Chrome and installed PWAs, which do
      // honour it. On iOS it is the seal below that actually fixes the bars.
      if (meta && color !== lastColor) {
        lastColor = color;
        meta.setAttribute("content", color);
      }

      if (isIOS()) sealTopScrim(scrims, color);
    };

    // Leading + trailing throttle: the class/style observer below is noisy during
    // animations, and each pass forces a style recalc.
    const schedule = () => {
      if (timer) return;
      const wait = THROTTLE_MS - (Date.now() - lastRun);
      if (wait <= 0) {
        run();
        return;
      }
      timer = window.setTimeout(() => {
        timer = 0;
        run();
      }, wait);
    };

    run();

    // Catches both modal families: the ones that scroll-lock via `body.style.overflow`
    // (an attribute change on body) and the ones that just mount a scrim (childList).
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    // Scrims fade in with `animate-in`, and a CSS animation mutates nothing, so
    // without this the colour could settle on a mid-fade opacity and stay there.
    document.addEventListener("animationend", schedule, true);
    document.addEventListener("transitionend", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      observer.disconnect();
      document.removeEventListener("animationend", schedule, true);
      document.removeEventListener("transitionend", schedule, true);
      window.removeEventListener("resize", schedule);
      if (timer) clearTimeout(timer);
    };
    // Re-running on theme change is what keeps the bars from staying stuck on the
    // old colour when the user switches mode while a modal is open.
  }, [resolvedTheme]);

  return null;
}
