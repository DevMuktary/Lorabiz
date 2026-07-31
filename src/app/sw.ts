// src/app/sw.ts
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  
  // CRITICAL SAFETY MEASURE FOR PRODUCTION:
  // By omitting defaultCache and leaving runtimeCaching empty, 
  // all APIs, OTPs, Paystack webhooks, and App Router navigations 
  // bypass the Service Worker completely and go straight to the network.
  runtimeCaching: [], 
});

serwist.addEventListeners();