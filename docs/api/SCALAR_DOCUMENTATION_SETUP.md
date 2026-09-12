# Lorabiz Developer API — Scalar Documentation Architecture

This document details the architecture, setup, and maintenance guidelines for the **Interactive API Documentation** powered by **Scalar**.

---

## 1. Overview & Experience

Lorabiz uses **Scalar** for developer documentation:
- **Fast, Modern, Interactive UI**: Delivers a developer reference experience with dark/light mode synchronization, keyboard navigation, request/response models, and multi-language code snippets.
- **Embedded API Explorer**: Developers can input their `lora_test_...` or `lora_live_...` key and test endpoints directly in the browser with live responses.
- **OpenAPI 3.1 Standards**: The documentation engine consumes an OpenAPI 3.1 specification served at `/api/openapi.json`.

---

## 2. Canonical API Endpoints Documented

1. **`POST /api/v1/nin/by-nin`**:
   - Verification and slip generation by 11-digit NIN.
   - Slip types: `nin_basic`, `nin_vnin`, `nin_regular`, `nin_standard`, `nin_premium`.
2. **`POST /api/v1/nin/by-phone`**:
   - Verification and slip generation by 11-digit Phone number.
   - Slip types: `nin_regular`, `nin_standard`, `nin_premium`.

---

## 3. Technical Implementation

### 3.1 Route Architecture

1. **OpenAPI Specification Endpoint**:
   - Route: `/api/openapi.json`
   - Implementation: `src/app/api/openapi.json/route.ts`
   - Generates the complete OpenAPI 3.1 JSON document including servers, security schemes (`BearerAuth`), tags, path parameters, request bodies, and typed responses.

2. **Scalar Reference Viewer**:
   - Route: `/docs`
   - Implementation: `src/app/docs/page.tsx`
   - Renders Scalar's reference engine configured with:
     - Spec URL: `/api/openapi.json`
     - Theme: Lorabiz dark/light branded styling
     - Code Generation: cURL, JavaScript (Fetch / Axios), Python (Requests), PHP (cURL), Go, Java.

---

## 4. Maintenance & Adding New Services

When extending the Lorabiz Developer API with new services (e.g., BVN verification, IPE Clearance, CAC Search):
1. Add the path and schema definitions to `src/lib/developer/openapi-spec.ts`.
2. Ensure request and response models strictly reflect normalized output contracts.
3. Verify that `/api/openapi.json` returns valid JSON with `status: 200`.
4. Open `/docs` in your browser to inspect rendering, parameter types, and live execution.
