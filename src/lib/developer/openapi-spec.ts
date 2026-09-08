export function getOpenApiSpec(baseUrl: string = "https://api.lorabiz.com") {
  return {
    openapi: "3.1.0",
    info: {
      title: "Lorabiz Developer API",
      version: "1.0.0",
      description:
        "High-performance REST API platform for verified National Identity Management Commission (NIMC) NIN verification, demographic resolution, and PDF slip printing.\n\n" +
        "### Key Features:\n" +
        "- **Dual Environment Support**: Test Mode (`lora_test_...`) with a virtual ₦1,000,000 sandbox balance, and Live Mode (`lora_live_...`) with atomic wallet deductions.\n" +
        "- **Zero-Risk Billing**: Failed validation calls (400) or unfound records (422) are charged **₦0.00**.\n" +
        "- **Direct Base64 PDF**: Instant, low-latency slip delivery directly in the response payload.\n" +
        "- **Normalized Schema**: Clean, predictable lowercase fields across all queries.",
      contact: {
        name: "Lorabiz Developer Support",
        url: "https://lorabiz.com/contact",
        email: "support@lorabiz.com",
      },
    },
    servers: [
      {
        url: baseUrl,
        description: "Lorabiz Production Gateway",
      },
      {
        url: "http://localhost:3000",
        description: "Localhost Development Server",
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "lora_live_... / lora_test_...",
          description:
            "Provide your Lorabiz API key prefixed with 'Bearer '. Both Live (`lora_live_...`) and Test (`lora_test_...`) keys are supported.",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "NIN verification slip generated successfully." },
            data: {
              type: "object",
              properties: {
                nin: { type: "string", example: "61904909560" },
                firstname: { type: "string", example: "MMESOMA" },
                middlename: { type: "string", nullable: true, example: "CELESTINA" },
                surname: { type: "string", example: "AGU" },
                fullname: { type: "string", example: "MMESOMA CELESTINA AGU" },
                gender: { type: "string", example: "Female" },
                birthdate: { type: "string", example: "1997-06-26" },
                telephoneno: { type: "string", nullable: true, example: "09047073004" },
                photo: { type: "string", description: "Base64 encoded JPEG image string" },
                address: { type: "string", nullable: true, example: "12 Awolowo Road" },
                residence_lga: { type: "string", nullable: true, example: "Ikeja" },
                residence_state: { type: "string", nullable: true, example: "Lagos" },
                self_origin_lga: { type: "string", nullable: true, example: "Aguata" },
                self_origin_state: { type: "string", nullable: true, example: "Anambra" },
                tracking_id: { type: "string", nullable: true, example: "12345ABC" },
              },
            },
            slip: {
              type: "object",
              properties: {
                slip_type: { type: "string", example: "nin_premium" },
                display_name: { type: "string", example: "Premium Card Slip" },
                pdf_base64: { type: "string", description: "Full binary PDF encoded as base64 string" },
              },
            },
            transaction: {
              type: "object",
              properties: {
                reference: { type: "string", example: "NIN_PREMIUM_1725732104912" },
                client_reference: { type: "string", nullable: true, example: "TXN_ORD_9812401" },
                amount_charged: { type: "number", example: 150.0 },
                currency: { type: "string", example: "NGN" },
                environment: { type: "string", enum: ["live", "test"], example: "live" },
                balance_after: { type: "number", example: 45850.0 },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "RECORD_NOT_FOUND" },
            message: { type: "string", example: "No identity record was found matching the provided NIN." },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            transaction: {
              type: "object",
              properties: {
                amount_charged: { type: "number", example: 0.0 },
                currency: { type: "string", example: "NGN" },
              },
            },
          },
        },
      },
    },
    paths: {
      "/api/v1/nin/by-nin": {
        post: {
          tags: ["NIN Identity & Slips"],
          summary: "Verify Identity & Print Slip by NIN",
          description:
            "Resolves a Nigerian citizen's 11-digit National Identification Number (NIN), returns normalized demographic records, and generates a NIMC verification slip in Base64 PDF format.\n\n" +
            "### Supported Slip Formats & Visual Previews:\n\n" +
            "1. **`nin_basic`** — *Basic Demographic Slip*\n" +
            "   Applicant personal bio-data and contact details.\n\n" +
            "   ![Basic Slip](/examples/nin_basic.png)\n\n" +
            "2. **`nin_vnin`** — *Virtual NIN (vNIN) Slip*\n" +
            "   Features 16-digit Virtual NIN and verification QR code.\n\n" +
            "   ![vNIN Slip](/examples/nin_vnin.png)\n\n" +
            "3. **`nin_regular`** — *Standard NIMC Regular Slip*\n" +
            "   Full-page standard document with applicant portrait.\n\n" +
            "   ![Regular Slip](/examples/nin_regular_example.png)\n\n" +
            "4. **`nin_standard`** — *Standard Biometric KYC Slip*\n" +
            "   High-definition identity layout with detailed applicant information.\n\n" +
            "   ![Standard Slip](/examples/nin_standard_example.png)\n\n" +
            "5. **`nin_premium`** — *Premium Card Slip*\n" +
            "   Front and back wallet-sized layout optimized for plastic PVC card printing.\n\n" +
            "   ![Premium Slip](/examples/nin_premium_example.png)\n\n" +
            "### Sandbox Test Identifiers:\n" +
            "- **Success (Female Record)**: `61904909560` (Returns 200 OK)\n" +
            "- **Success (Male Record)**: `12345678901` (Returns 200 OK)\n" +
            "- **Record Not Found (422)**: `00000000000` or `99999999999` (Returns 422, billed ₦0.00)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nin", "slip_type"],
                  properties: {
                    nin: {
                      type: "string",
                      description: "11-digit National Identification Number",
                      example: "61904909560",
                    },
                    slip_type: {
                      type: "string",
                      enum: ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"],
                      description: "Selected slip printing layout format",
                      example: "nin_premium",
                    },
                    client_reference: {
                      type: "string",
                      description: "Optional custom transaction/order reference for idempotency and external tracking",
                      example: "TXN_ORD_9812401",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Verification successful and slip generated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "400": {
              description: "Validation Error (invalid NIN length or unsupported slip type)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized (missing or invalid API key)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "402": {
              description: "Insufficient Balance (wallet or test sandbox balance too low)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "422": {
              description: "Record Not Found (NIN does not exist in national registry)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too Many Requests (rate limit exceeded)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "503": {
              description: "Service Unavailable (gateway undergoing scheduled maintenance)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/by-phone": {
        post: {
          tags: ["NIN Identity & Slips"],
          summary: "Verify Identity & Print Slip by Phone Number",
          description:
            "Resolves an 11-digit Nigerian registered mobile phone number to its linked National Identification Number (NIN) profile and generates a NIMC verification slip.\n\n" +
            "### Supported Slip Formats & Visual Previews:\n\n" +
            "1. **`nin_regular`** — *Standard NIMC Regular Slip*\n" +
            "   Full-page standard document with resolved applicant portrait.\n\n" +
            "   ![Regular Slip](/examples/nin_regular_example.png)\n\n" +
            "2. **`nin_standard`** — *Standard Biometric KYC Slip*\n" +
            "   Comprehensive identity layout with detailed applicant information.\n\n" +
            "   ![Standard Slip](/examples/nin_standard_example.png)\n\n" +
            "3. **`nin_premium`** — *Premium Card Slip*\n" +
            "   Front and back wallet-sized layout optimized for plastic PVC card printing.\n\n" +
            "   ![Premium Slip](/examples/nin_premium_example.png)\n\n" +
            "### Sandbox Test Identifiers:\n" +
            "- **Success (Female Record)**: `09047073004` (Returns 200 OK)\n" +
            "- **Success (Male Record)**: `08012345678` (Returns 200 OK)\n" +
            "- **Record Not Found (422)**: `00000000000` or `07000000000` (Returns 422, billed ₦0.00)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone", "slip_type"],
                  properties: {
                    phone: {
                      type: "string",
                      description: "11-digit Nigerian mobile phone number",
                      example: "09047073004",
                    },
                    slip_type: {
                      type: "string",
                      enum: ["nin_regular", "nin_standard", "nin_premium"],
                      description: "Selected slip printing layout format",
                      example: "nin_premium",
                    },
                    client_reference: {
                      type: "string",
                      description: "Optional custom transaction reference",
                      example: "TXN_PHONE_9812402",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Phone verification successful and slip generated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "400": {
              description: "Validation Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "402": {
              description: "Insufficient Balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "422": {
              description: "Record Not Found (phone number not linked to any NIN profile)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "503": {
              description: "Service Unavailable",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  };
}
