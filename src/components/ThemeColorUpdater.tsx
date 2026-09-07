"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Single owner of <meta name="theme-color">, which is what iOS Safari uses to tint
 * the phone status bar and its own bottom toolbar.
 *
 * Two problems this solves:
 *
 * 1. The tag used to be declared in the `viewport` export keyed on
 *    `prefers-color-scheme`, but the app themes itself with a `.dark` class via
 *    next-themes. Anyone whose in-app theme differed from their OS setting got a
 *    permanently mismatched bar. Here the color comes from the *resolved* theme.
 *
 * 2. When a modal opens, the page dims behind a full-screen scrim but the bars kept
 *    pointing at the undimmed background — bright bars framing a dark screen, which
 *    reads as a stray box above and below the modal. So instead of hardcoding a
 *    "modal is open" color, we read whatever scrim is actually on screen and
 *    composite it over the page background. That works for every overlay in the app
 *    without any of them needing to know this exists.
 */

const META_ID = "app-theme-color";

/** An overlay only tints the browser chrome if it covers essentially the whole screen. */
const COVERAGE_RATIO = 0.9;

/** Overlays open/close rarely; this bounds the cost of the DOM observer below. */
const THROTTLE_MS = 100;

type ScrimLayer = { color: string; alpha: number };

/**
 * Every overlay in the app is a `fixed inset-0` scrim, so that class is a cheap and
 * accurate way to find them. Returned bottom-up in paint order.
 */
function collectScrims(): ScrimLayer[] {
  // clientWidth/clientHeight excludes any scrollbar, so it matches what a
  // `position: fixed` element actually spans.
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  if (!vw || !vh) return [];

  const minArea = vw * vh * COVERAGE_RATIO;
  const found: { layer: ScrimLayer; z: number }[] = [];

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
        layer: { color: style.backgroundColor, alpha: Math.min(alpha, 1) },
        z: Number(style.zIndex) || 0,
      });
    });

  // Stable sort keeps document order for equal z-index, matching paint order.
  return found.sort((a, b) => a.z - b.z).map((entry) => entry.layer);
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

function resolveChromeColor(): string {
  const ctx = getCanvas();
  if (!ctx) return "";

  // Stacking the layers on a canvas rather than doing the math by hand means any
  // color space the browser understands works — Tailwind v4 computes an opacity
  // modifier like `bg-black/60` to `oklab(0 0 0 / 0.6)`, not `rgba(...)`.
  ctx.clearRect(0, 0, 1, 1);
  ctx.globalAlpha = 1;

  // globals.css sets `html { background-color: hsl(var(--background)) }`, so this
  // tracks the live theme without duplicating the palette here.
  ctx.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);

  for (const { color, alpha } of collectScrims()) {
    ctx.globalAlpha = alpha;
    // A value the canvas can't parse leaves fillStyle untouched, which would
    // re-apply the previous layer. Reset to fully transparent so a failed
    // assignment paints nothing instead.
    ctx.fillStyle = "#00000000";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
  }

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  // Nothing opaque resolved (stylesheet not applied yet) — leave the tag alone.
  if (!a) return "";

  return `rgb(${r}, ${g}, ${b})`;
}

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.getElementById(META_ID) as HTMLMetaElement | null;
    if (!meta) return;

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
      const next = resolveChromeColor();
      if (next && next !== lastColor) {
        lastColor = next;
        meta.setAttribute("content", next);
      }
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
    // without this the color could settle on a mid-fade opacity and stay there.
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
    // old color when the user switches mode while a modal is open.
  }, [resolvedTheme]);

  return null;
}
