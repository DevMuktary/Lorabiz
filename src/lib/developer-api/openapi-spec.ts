export const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Lorabiz B2B Verification & Compliance APIs",
    version: "1.0.0",
    description: `
Welcome to the **Lorabiz Developer API Reference**.

Lorabiz provides high-speed, enterprise-grade verification APIs for Nigerian identities (NIN, Phone, vNIN, BVN), business compliance (CAC, Tax ID/TIN, SCUML), utility vending, and AI KYC Biometric Liveness.

---

### Key Developer Features
* **Dual-Wallet Sandbox Isolation**: Test requests with \`lora_test_...\` keys run in a full deterministic sandbox environment funded with ₦1,000,000 test funds. Live funds are never touched during sandbox testing.
* **Idempotency Guarantee**: Pass an \`Idempotency-Key: <unique_uuid>\` header to safely retry requests without risk of double-charging.
* **Automatic Instant Refunds**: If a refundable lookup fails or no record is found, the charged fee is automatically and instantly returned to your wallet.
* **Authentication**: Pass your API key in the \`Authorization: Bearer <your_api_key>\` HTTP header.

---
### Sandbox Test Identifiers
* **11111111111** (or **08011111111**): Valid citizen record (Musa Ibrahim Bello).
* **22222222222** (or **08022222222**): Valid citizen record (Chidinma Grace Okonkwo).
* **33333333333** (or **08033333333**): Valid citizen record (Oluwaseun David Adeleke).
* **99999999999**: Simulates a \`404 NO_RECORD_FOUND\` response and triggers an automated refund test.
    `,
    contact: {
      name: "Lorabiz Developer Support",
      url: "https://lorabiz.com",
      email: "support@lorabiz.com",
    },
  },
  servers: [
    {
      url: "https://api.lorabiz.com",
      description: "Live Production Gateway",
    },
    {
      url: "http://localhost:3000",
      description: "Local / Development Gateway",
    },
  ],
  security: [
    {
      BearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "lora_live_... | lora_test_...",
        description: "Enter your Lorabiz API key (e.g. `lora_live_...` for live or `lora_test_...` for sandbox).",
      },
    },
    headers: {
      IdempotencyKey: {
        schema: {
          type: "string",
          example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        },
        description: "Unique UUID to guarantee idempotency and avoid duplicate charges on retries.",
      },
    },
    schemas: {
      StandardSuccessResponse: {
        type: "object",
        properties: {
          status: { type: "boolean", example: true },
          message: { type: "string", example: "NIN details retrieved successfully." },
          reference: { type: "string", example: "LORA_API_TEST_1772412891234_A9F2" },
          environment: { type: "string", enum: ["SANDBOX", "LIVE"], example: "SANDBOX" },
          chargedAmount: { type: "number", example: 100 },
          currency: { type: "string", example: "NGN" },
          data: { type: "object" },
        },
      },
      StandardErrorResponse: {
        type: "object",
        properties: {
          status: { type: "boolean", example: false },
          error: { type: "string", example: "INVALID_NIN_FORMAT" },
          message: { type: "string", example: "NIN must be exactly 11 numeric digits." },
          reference: { type: "string", example: "LORA_API_TEST_1772412891234_A9F2" },
          environment: { type: "string", enum: ["SANDBOX", "LIVE"], example: "SANDBOX" },
          chargedAmount: { type: "number", example: 0 },
          refunded: { type: "boolean", example: true },
          statusCode: { type: "integer", example: 400 },
        },
      },
      NinDemographics: {
        type: "object",
        properties: {
          nin: { type: "string", example: "11111111111" },
          vnin: { type: "string", example: "AB11111111111XYZ" },
          firstname: { type: "string", example: "Musa" },
          surname: { type: "string", example: "Bello" },
          middlename: { type: "string", example: "Ibrahim" },
          fullname: { type: "string", example: "Musa Ibrahim Bello" },
          birthdate: { type: "string", example: "1990-05-12" },
          gender: { type: "string", example: "MALE" },
          telephoneno: { type: "string", example: "08011111111" },
          residence_state: { type: "string", example: "Kano" },
          residence_lga: { type: "string", example: "Nasarawa" },
          residence_address: { type: "string", example: "Plot 14, Gwarzo Road, Kano" },
          photo: { type: "string", example: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d" },
          slipPdfUrl: { type: "string", nullable: true, example: "https://res.cloudinary.com/lorabiz/sample_slip.pdf" },
        },
      },
    },
  },
  paths: {
    "/api/v1/nin-verification/nin": {
      post: {
        tags: ["NIN Verification"],
        summary: "Verify NIN by 11-Digit Number",
        description: "Fetches official NIMC identity details and demographics for a given 11-digit National Identification Number (NIN).",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional UUID to prevent duplicate billing on network retries.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nin"],
                properties: {
                  nin: {
                    type: "string",
                    description: "The 11-digit NIN of the citizen.",
                    example: "11111111111",
                  },
                  includeSlip: {
                    type: "boolean",
                    description: "If true, generates and returns an official PDF verification slip URL.",
                    example: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "NIN details retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/StandardSuccessResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/NinDemographics" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": {
            description: "Invalid input or format error.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          "401": {
            description: "Authentication failed. Missing or invalid API key.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          "402": {
            description: "Insufficient wallet balance (Live or Sandbox).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          "404": {
            description: "No record found for the provided NIN (Auto-refunded).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/v1/nin-verification/phone": {
      post: {
        tags: ["NIN Verification"],
        summary: "Verify NIN by Linked Phone Number",
        description: "Fetches official NIMC identity details linked to an 11-digit Nigerian mobile phone number.",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional UUID to prevent duplicate billing on network retries.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phone"],
                properties: {
                  phone: {
                    type: "string",
                    description: "11-digit Nigerian mobile phone number.",
                    example: "08011111111",
                  },
                  includeSlip: {
                    type: "boolean",
                    description: "If true, generates and returns an official PDF verification slip URL.",
                    example: false,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Identity details retrieved successfully.",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/StandardSuccessResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/NinDemographics" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": {
            description: "Invalid phone number format.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          "404": {
            description: "No NIMC record found linked to the provided phone number.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },

    "/api/v1/nin-verification/vnin": {
      post: {
        tags: ["NIN Verification"],
        summary: "Generate VNIN Slip by 11-Digit NIN",
        description: "Generates an official NIMC Virtual NIN (vNIN) slip and resolves demographic identity details for a given 11-digit National Identification Number (NIN).",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Optional UUID to prevent duplicate billing on network retries.",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["nin"],
                properties: {
                  nin: {
                    type: "string",
                    description: "11-digit citizen National Identification Number (NIN).",
                    example: "11111111111",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "VNIN slip and citizen identity details generated successfully.",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/StandardSuccessResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/NinDemographics" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": {
            description: "Invalid NIN format or missing input.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
          "404": {
            description: "No record found for the provided NIN (Auto-refunded).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

