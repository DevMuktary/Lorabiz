export function getOpenApiSpec(baseUrl: string = "https://api.lorabiz.com") {
  return {
    openapi: "3.1.0",
    info: {
      title: "Lorabiz Developer API",
      version: "1.0.0",
      description:
        "Welcome to the Lorabiz Developer Platform API Reference. Lorabiz provides enterprise API infrastructure for identity verification, regulatory registrations, and government documentation in Nigeria.\n\n" +
        "### Base URL\n" +
        "All API requests are served over secure HTTPS:\n" +
        "- **Production Gateway**: `" + baseUrl + "`\n\n" +
        "### Authentication\n" +
        "Authenticate all requests using your API key via either:\n" +
        "- `Authorization: Bearer <api_key>`\n" +
        "- `Authorization: <api_key>`\n" +
        "- `x-api-key: <api_key>`\n\n" +
        "Manage your keys in the [Lorabiz Developer Dashboard](https://lorabiz.com/dashboard/developer).\n\n" +
        "### Environments: Test Sandbox vs Live\n" +
        "- **Test Mode (`lora_test_...`)**: Preloaded with virtual ₦1,000,000.00 sandbox balance. Real funds are never deducted. Deterministic test numbers are provided per endpoint to simulate both success and error paths.\n" +
        "- **Live Mode (`lora_live_...`)**: Connects directly to production national databases. Charges wholesale fees atomically on successful 2xx verifications.",
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
    ],
    tags: [
      {
        name: "NIN Slip Generation",
        description:
          "Generate biometric verification slips (Regular, Standard, Premium, Basic, and vNIN layouts) by National Identification Number (NIN) or registered phone number.\n\n" +
          "**Billing Policy for NIN Slips**:\n" +
          "Accounts are only billed when a verification slip is successfully resolved and generated (HTTP 200). " +
          "If no record exists in the national database (HTTP 422 RECORD_NOT_FOUND) or if the request contains validation errors (HTTP 400), the transaction is billed ₦0.00.",
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
          description: "Provide your Lorabiz API key prefixed with 'Bearer '. Supports both Live and Test keys.",
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
        ValidationErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "VALIDATION_ERROR" },
            message: { type: "string", example: "Please provide a valid 11-digit identifier." },
          },
          example: {
            status: "error",
            code: "VALIDATION_ERROR",
            message: "Please provide a valid 11-digit identifier.",
          },
        },
        UnauthorizedErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "UNAUTHORIZED" },
            message: { type: "string", example: "Invalid, revoked, or expired API key. Please check your key in the Developer Console." },
          },
          example: {
            status: "error",
            code: "UNAUTHORIZED",
            message: "Invalid, revoked, or expired API key. Please check your key in the Developer Console.",
          },
        },
        InsufficientBalanceResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "INSUFFICIENT_BALANCE" },
            message: { type: "string", example: "Insufficient live balance. Service costs ₦150.00, but current balance is ₦0.00." },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            transaction: {
              type: "object",
              properties: {
                required_amount: { type: "number", example: 150.0 },
                current_balance: { type: "number", example: 0.0 },
                amount_charged: { type: "number", example: 0.0 },
                currency: { type: "string", example: "NGN" },
              },
            },
          },
          example: {
            status: "error",
            code: "INSUFFICIENT_BALANCE",
            message: "Insufficient live balance. Service costs ₦150.00, but current balance is ₦0.00.",
            environment: "live",
            transaction: {
              required_amount: 150.0,
              current_balance: 0.0,
              amount_charged: 0.0,
              currency: "NGN",
            },
          },
        },
        RecordNotFoundResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "RECORD_NOT_FOUND" },
            message: { type: "string", example: "No identity record was found matching the provided identifier." },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            transaction: {
              type: "object",
              properties: {
                amount_charged: { type: "number", example: 0.0 },
                currency: { type: "string", example: "NGN" },
              },
            },
          },
          example: {
            status: "error",
            code: "RECORD_NOT_FOUND",
            message: "No identity record was found matching the provided identifier.",
            environment: "live",
            transaction: {
              amount_charged: 0.0,
              currency: "NGN",
            },
          },
        },
        RateLimitErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "RATE_LIMITED" },
            message: { type: "string", example: "Too many requests. Limit is 60 requests per minute in live mode." },
          },
          example: {
            status: "error",
            code: "RATE_LIMITED",
            message: "Too many requests. Limit is 60 requests per minute in live mode.",
          },
        },
        ServiceUnavailableResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "SERVICE_UNAVAILABLE" },
            message: { type: "string", example: "The identity gateway is temporarily undergoing maintenance. Please retry shortly." },
          },
          example: {
            status: "error",
            code: "SERVICE_UNAVAILABLE",
            message: "The identity gateway is temporarily undergoing maintenance. Please retry shortly.",
          },
        },
      },
    },
    paths: {
      "/api/v1/nin/by-nin": {
        post: {
          tags: ["NIN Slip Generation"],
          summary: "Verify Identity & Generate Slip by NIN",
          description:
            "Verifies an 11-digit NIN against the national identity registry and generates a biometric slip in Base64 PDF format.\n\n" +
            "#### Supported Slip Formats (Click to preview):\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_basic</strong> — Basic Demographic Slip</summary>\n" +
            "  <img src=\"/examples/nin_basic.png\" alt=\"Basic Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_vnin</strong> — Virtual NIN (vNIN) Slip</summary>\n" +
            "  <img src=\"/examples/nin_vnin.png\" alt=\"vNIN Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_regular</strong> — Standard Regular Slip</summary>\n" +
            "  <img src=\"/examples/nin_regular_example.png\" alt=\"Regular Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_standard</strong> — Standard Biometric Slip</summary>\n" +
            "  <img src=\"/examples/nin_standard_example.png\" alt=\"Standard Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_premium</strong> — Premium Card Slip</summary>\n" +
            "  <img src=\"/examples/nin_premium_example.png\" alt=\"Premium Slip Preview\" />\n" +
            "</details>\n\n" +
            "#### Sandbox Test Identifiers:\n" +
            "- **Success (Female)**: `61904909560` (Returns 200 OK)\n" +
            "- **Success (Male)**: `12345678901` (Returns 200 OK)\n" +
            "- **Record Not Found**: `00000000000` or `99999999999` (Returns 422 RECORD_NOT_FOUND, billed ₦0.00)",
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
                      description: "Optional custom transaction reference",
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
                  example: {
                    status: "success",
                    message: "NIN verification slip generated successfully.",
                    data: {
                      nin: "61904909560",
                      firstname: "MMESOMA",
                      middlename: "CELESTINA",
                      surname: "AGU",
                      fullname: "MMESOMA CELESTINA AGU",
                      gender: "Female",
                      birthdate: "1997-06-26",
                      telephoneno: "09047073004",
                      photo: "/9j/4AAQSkZJRgABAQ...",
                      address: "12 Awolowo Road",
                      residence_lga: "Ikeja",
                      residence_state: "Lagos",
                      self_origin_lga: "Aguata",
                      self_origin_state: "Anambra",
                      tracking_id: "12345ABC",
                    },
                    slip: {
                      slip_type: "nin_premium",
                      display_name: "Premium Card Slip",
                      pdf_base64: "JVBERi0xLjQKJ...",
                    },
                    transaction: {
                      reference: "NIN_PREMIUM_1725732104912",
                      client_reference: "TXN_ORD_9812401",
                      amount_charged: 150.0,
                      currency: "NGN",
                      environment: "live",
                      balance_after: 45850.0,
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation Error (invalid input or parameters)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                  example: {
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Please provide a valid 11-digit National Identification Number (NIN).",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized (missing or invalid API key)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                  example: {
                    status: "error",
                    code: "UNAUTHORIZED",
                    message: "Invalid, revoked, or expired API key. Please check your key in the Developer Console.",
                  },
                },
              },
            },
            "402": {
              description: "Insufficient Balance (wallet or test balance too low)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InsufficientBalanceResponse" },
                  example: {
                    status: "error",
                    code: "INSUFFICIENT_BALANCE",
                    message: "Insufficient live balance. Service costs ₦150.00, but current balance is ₦0.00.",
                    environment: "live",
                    transaction: {
                      required_amount: 150.0,
                      current_balance: 0.0,
                      amount_charged: 0.0,
                      currency: "NGN",
                    },
                  },
                },
              },
            },
            "422": {
              description: "Record Not Found (NIN does not exist in national registry)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordNotFoundResponse" },
                  example: {
                    status: "error",
                    code: "RECORD_NOT_FOUND",
                    message: "No identity record was found matching the provided National Identification Number (NIN).",
                    environment: "live",
                    transaction: {
                      amount_charged: 0.0,
                      currency: "NGN",
                    },
                  },
                },
              },
            },
            "429": {
              description: "Too Many Requests (rate limit exceeded)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                  example: {
                    status: "error",
                    code: "RATE_LIMITED",
                    message: "Too many requests. Limit is 60 requests per minute in live mode.",
                  },
                },
              },
            },
            "503": {
              description: "Service Unavailable (gateway temporary maintenance)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceUnavailableResponse" },
                  example: {
                    status: "error",
                    code: "SERVICE_UNAVAILABLE",
                    message: "The identity gateway is temporarily undergoing maintenance. Please retry shortly.",
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/by-phone": {
        post: {
          tags: ["NIN Slip Generation"],
          summary: "Verify Identity & Generate Slip by Phone Number",
          description:
            "Resolves a linked NIN profile using an 11-digit registered phone number and generates a biometric slip in Base64 PDF format.\n\n" +
            "#### Supported Slip Formats (Click to preview):\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_regular</strong> — Standard Regular Slip</summary>\n" +
            "  <img src=\"/examples/nin_regular_example.png\" alt=\"Regular Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_standard</strong> — Standard Biometric Slip</summary>\n" +
            "  <img src=\"/examples/nin_standard_example.png\" alt=\"Standard Slip Preview\" />\n" +
            "</details>\n\n" +
            "<details>\n" +
            "  <summary><strong>nin_premium</strong> — Premium Card Slip</summary>\n" +
            "  <img src=\"/examples/nin_premium_example.png\" alt=\"Premium Slip Preview\" />\n" +
            "</details>\n\n" +
            "#### Sandbox Test Identifiers:\n" +
            "- **Success (Female)**: `09047073004` (Returns 200 OK)\n" +
            "- **Success (Male)**: `08012345678` (Returns 200 OK)\n" +
            "- **Record Not Found**: `00000000000` or `07000000000` (Returns 422 RECORD_NOT_FOUND, billed ₦0.00)",
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
                      description: "11-digit registered Nigerian mobile phone number",
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
                  example: {
                    status: "success",
                    message: "NIN verification slip generated successfully.",
                    data: {
                      nin: "61904909560",
                      firstname: "MMESOMA",
                      middlename: "CELESTINA",
                      surname: "AGU",
                      fullname: "MMESOMA CELESTINA AGU",
                      gender: "Female",
                      birthdate: "1997-06-26",
                      telephoneno: "09047073004",
                      photo: "/9j/4AAQSkZJRgABAQ...",
                      address: "12 Awolowo Road",
                      residence_lga: "Ikeja",
                      residence_state: "Lagos",
                      self_origin_lga: "Aguata",
                      self_origin_state: "Anambra",
                      tracking_id: "12345ABC",
                    },
                    slip: {
                      slip_type: "nin_premium",
                      display_name: "Premium Card Slip",
                      pdf_base64: "JVBERi0xLjQKJ...",
                    },
                    transaction: {
                      reference: "NIN_PHONE_PREMIUM_1725732104912",
                      client_reference: "TXN_PHONE_9812402",
                      amount_charged: 150.0,
                      currency: "NGN",
                      environment: "live",
                      balance_after: 45850.0,
                    },
                  },
                },
              },
            },
            "400": {
              description: "Validation Error (invalid input or parameters)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                  example: {
                    status: "error",
                    code: "VALIDATION_ERROR",
                    message: "Please provide a valid 11-digit registered Nigerian mobile phone number.",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized (missing or invalid API key)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                  example: {
                    status: "error",
                    code: "UNAUTHORIZED",
                    message: "Invalid, revoked, or expired API key. Please check your key in the Developer Console.",
                  },
                },
              },
            },
            "402": {
              description: "Insufficient Balance (wallet or test balance too low)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InsufficientBalanceResponse" },
                  example: {
                    status: "error",
                    code: "INSUFFICIENT_BALANCE",
                    message: "Insufficient live balance. Service costs ₦150.00, but current balance is ₦0.00.",
                    environment: "live",
                    transaction: {
                      required_amount: 150.0,
                      current_balance: 0.0,
                      amount_charged: 0.0,
                      currency: "NGN",
                    },
                  },
                },
              },
            },
            "422": {
              description: "Record Not Found (phone number not linked to any NIN profile)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordNotFoundResponse" },
                  example: {
                    status: "error",
                    code: "RECORD_NOT_FOUND",
                    message: "No identity record was found matching the provided phone number.",
                    environment: "live",
                    transaction: {
                      amount_charged: 0.0,
                      currency: "NGN",
                    },
                  },
                },
              },
            },
            "429": {
              description: "Too Many Requests (rate limit exceeded)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                  example: {
                    status: "error",
                    code: "RATE_LIMITED",
                    message: "Too many requests. Limit is 60 requests per minute in live mode.",
                  },
                },
              },
            },
            "503": {
              description: "Service Unavailable (gateway temporary maintenance)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceUnavailableResponse" },
                  example: {
                    status: "error",
                    code: "SERVICE_UNAVAILABLE",
                    message: "The identity gateway is temporarily undergoing maintenance. Please retry shortly.",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
