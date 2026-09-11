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
      {
        name: "NIN Validation",
        description:
          "Submit and poll NIN validation requests for No Record Found, VNIN Validation, Modification, and Photo Error.",
      },
      {
        name: "NIMC IPE Clearance",
        description:
          "Submit and poll NIMC IPE Clearance requests to clear In-Processing Errors and release updated tracking IDs and cleared NINs.",
      },
      {
        name: "NIMC NIN Personalization",
        description:
          "Submit and poll NIMC NIN Personalization requests by Tracking ID.",
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
                nin: { type: "string", example: "23456789012" },
                firstname: { type: "string", example: "FATIMA" },
                middlename: { type: "string", nullable: true, example: "ZAHRA" },
                surname: { type: "string", example: "ABUBAKAR" },
                fullname: { type: "string", example: "FATIMA ZAHRA ABUBAKAR" },
                gender: { type: "string", example: "Female" },
                birthdate: { type: "string", example: "1996-08-14" },
                telephoneno: { type: "string", nullable: true, example: "08023456789" },
                photo: { type: "string", description: "Base64 encoded JPEG image string" },
                address: { type: "string", nullable: true, example: "Plot 42 Ahmadu Bello Way" },
                residence_lga: { type: "string", nullable: true, example: "Abuja Municipal" },
                residence_state: { type: "string", nullable: true, example: "FCT" },
                self_origin_lga: { type: "string", nullable: true, example: "Kano Municipal" },
                self_origin_state: { type: "string", nullable: true, example: "Kano" },
                tracking_id: { type: "string", nullable: true, example: "TRK-881920" },
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
        ValidationSubmitResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "NIN validation request submitted successfully." },
            reference: { type: "string", example: "nin_val_da7c1d16cd69891a7a9044" },
            client_reference: { type: "string", nullable: true, example: "REF_MY_APP_99182" },
            nin: { type: "string", example: "18867568313" },
            validation_type: { type: "string", example: "no_record_found" },
            request_status: { type: "string", enum: ["submitted", "processing", "validated", "failed"], example: "submitted" },
            amount_charged: { type: "number", example: 700.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
          },
        },
        ValidationStatusResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            reference: { type: "string", example: "nin_val_da7c1d16cd69891a7a9044" },
            client_reference: { type: "string", nullable: true, example: "REF_MY_APP_99182" },
            nin: { type: "string", example: "18867568313" },
            validation_type: { type: "string", example: "no_record_found" },
            request_status: { type: "string", enum: ["submitted", "processing", "validated", "failed"], example: "validated" },
            message: { type: "string", example: "NIN Validation completed successfully." },
            error_detail: { type: "string", nullable: true, example: null },
            completed_at: { type: "string", format: "date-time", nullable: true, example: "2026-09-09T08:35:12.000Z" },
            refunded: { type: "boolean", description: "Indicates whether the debited amount was refunded (only present when request_status is 'failed')", example: true },
            amount_charged: { type: "number", example: 700.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            date: { type: "string", format: "date-time", example: "2026-09-09T08:15:00.000Z" },
          },
        },
        IpeSubmitResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "NIMC IPE Clearance request submitted successfully." },
            reference: { type: "string", example: "lora_ipe_1725934820123_xyz89" },
            tracking_id: { type: "string", example: "0TEB51VS5RES4ZZ" },
            client_reference: { type: "string", nullable: true, example: "kyc_ipe_order_10029" },
            request_status: { type: "string", enum: ["submitted", "processing", "completed", "failed"], example: "submitted" },
            amount_charged: { type: "number", example: 2500.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
          },
        },
        IpeStatusResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            reference: { type: "string", example: "lora_ipe_1725934820123_xyz89" },
            tracking_id: { type: "string", example: "0TEB51VS5RES4ZZ" },
            client_reference: { type: "string", nullable: true, example: "kyc_ipe_order_10029" },
            request_status: { type: "string", enum: ["submitted", "processing", "completed", "failed"], example: "completed" },
            message: { type: "string", example: "IPE Clearance completed successfully." },
            new_tracking_id: { type: "string", nullable: true, example: "0T448N2SR7OFAZC" },
            resolved_nin: { type: "string", nullable: true, example: "44297896804" },
            error_detail: { type: "string", nullable: true, example: null },
            completed_at: { type: "string", format: "date-time", nullable: true, example: "2026-09-05T21:47:56.000Z" },
            refunded: { type: "boolean", description: "Indicates whether the debited amount was refunded (only present when request_status is 'failed')", example: true },
            amount_charged: { type: "number", example: 2500.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            date: { type: "string", format: "date-time", example: "2026-09-05T20:30:12.000Z" },
          },
        },
        PersonalizationSubmitResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string", example: "NIN Personalization request submitted successfully." },
            reference: { type: "string", example: "lora_pzn_1725934820123_abc45" },
            tracking_id: { type: "string", example: "0TEB51VS5RES4ZZ" },
            client_reference: { type: "string", nullable: true, example: "kyc_pzn_1001" },
            request_status: { type: "string", enum: ["submitted", "processing", "completed", "failed"], example: "submitted" },
            amount_charged: { type: "number", example: 1500.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
          },
        },
        PersonalizationStatusResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            reference: { type: "string", example: "lora_pzn_1725934820123_abc45" },
            tracking_id: { type: "string", example: "0TEB51VS5RES4ZZ" },
            client_reference: { type: "string", nullable: true, example: "kyc_pzn_1001" },
            request_status: { type: "string", enum: ["submitted", "processing", "completed", "failed"], example: "completed" },
            message: { type: "string", example: "NIN Personalization completed successfully." },
            resolved_nin: { type: "string", nullable: true, example: "44297896804" },
            pdf_base64: { type: "string", nullable: true, description: "Raw base64-encoded PDF slip document" },
            data: {
              type: "object",
              nullable: true,
              properties: {
                nin: { type: "string", example: "44297896804" },
                firstname: { type: "string", example: "IBRAHIM" },
                surname: { type: "string", example: "MUSA" },
                middlename: { type: "string", example: "BELLO" },
                birthdate: { type: "string", example: "1995-04-12" },
                gender: { type: "string", example: "Male" },
                telephoneno: { type: "string", example: "08012345678" },
                residence_state: { type: "string", example: "Kano" },
                photo: { type: "string", example: "/9j/4AAQSkZJRg..." },
              },
            },
            error_detail: { type: "string", nullable: true, example: null },
            completed_at: { type: "string", format: "date-time", nullable: true, example: "2026-09-10T14:50:00.000Z" },
            refunded: { type: "boolean", description: "Indicates whether the debited amount was refunded (only present when request_status is 'failed')", example: false },
            amount_charged: { type: "number", description: "Debited processing fee (explicitly present across all states, including processing)", example: 1500.0 },
            currency: { type: "string", example: "NGN" },
            environment: { type: "string", enum: ["live", "test"], example: "live" },
            date: { type: "string", format: "date-time", example: "2026-09-10T14:45:00.000Z" },
          },
        },
        DuplicateRequestResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            code: { type: "string", example: "DUPLICATE_REQUEST" },
            message: { type: "string", example: "An active validation request is already in progress for this NIN. Duplicate submission rejected to prevent double debits." },
            reference: { type: "string", example: "nin_val_da7c1d16cd69891a7a9044" },
            client_reference: { type: "string", nullable: true, example: "REF_MY_APP_99182" },
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
            "- **Success (Female)**: `23456789012` (Returns 200 OK)\n" +
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
                      example: "23456789012",
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
                      nin: "23456789012",
                      firstname: "FATIMA",
                      middlename: "ZAHRA",
                      surname: "ABUBAKAR",
                      fullname: "FATIMA ZAHRA ABUBAKAR",
                      gender: "Female",
                      birthdate: "1996-08-14",
                      telephoneno: "08023456789",
                      photo: "/9j/4AAQSkZJRgABAQ...",
                      address: "Plot 42 Ahmadu Bello Way",
                      residence_lga: "Abuja Municipal",
                      residence_state: "FCT",
                      self_origin_lga: "Kano Municipal",
                      self_origin_state: "Kano",
                      tracking_id: "TRK-881920",
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
            "- **Success (Female)**: `08023456789` (Returns 200 OK)\n" +
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
                      example: "08023456789",
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
                      nin: "23456789012",
                      firstname: "FATIMA",
                      middlename: "ZAHRA",
                      surname: "ABUBAKAR",
                      fullname: "FATIMA ZAHRA ABUBAKAR",
                      gender: "Female",
                      birthdate: "1996-08-14",
                      telephoneno: "08023456789",
                      photo: "/9j/4AAQSkZJRgABAQ...",
                      address: "Plot 42 Ahmadu Bello Way",
                      residence_lga: "Abuja Municipal",
                      residence_state: "FCT",
                      self_origin_lga: "Kano Municipal",
                      self_origin_state: "Kano",
                      tracking_id: "TRK-881920",
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
      "/api/v1/nin/validation": {
        post: {
          tags: ["NIN Validation"],
          summary: "Submit NIN Validation Request",
          description:
            "Submits an 11-digit NIN for validation processing.\n\n" +
            "#### Validation Categories (`validation_type`):\n" +
            "- `no_record_found` (No Record Found)\n" +
            "- `vnin_validation` (VNIN / SIM / Bank Validation)\n" +
            "- `modification` (Record Modification)\n" +
            "- `photo_error` (Photo Error Correction)\n\n" +
            "#### Sandbox Test NINs:\n" +
            "In test mode (`lora_test_...`), use the following designated test NINs to simulate validation outcomes:\n" +
            "- `11111111111`: Success simulation (transitions to `validated`)\n" +
            "- `22222222222`: Failure simulation (transitions to `failed`, `refunded: true`)\n" +
            "- `99999999999`: Duplicate Conflict simulation (returns `409 DUPLICATE_REQUEST`)\n\n" +
            "You can supply any random `client_reference` of your choice (e.g., `order_12345`).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nin", "validation_type"],
                  properties: {
                    nin: {
                      type: "string",
                      description: "11-digit National Identification Number to validate",
                      example: "18867568313",
                    },
                    validation_type: {
                      type: "string",
                      enum: ["no_record_found", "vnin_validation", "modification", "photo_error"],
                      description: "Category of NIN validation requested",
                      example: "no_record_found",
                    },
                    client_reference: {
                      type: "string",
                      description: "Optional developer reference for idempotent tracking and status queries",
                      example: "REF_MY_APP_99182",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Validation request queued successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationSubmitResponse" },
                  example: {
                    status: "success",
                    message: "NIN validation request submitted successfully.",
                    reference: "nin_val_da7c1d16cd69891a7a9044",
                    client_reference: "REF_MY_APP_99182",
                    nin: "18867568313",
                    validation_type: "no_record_found",
                    request_status: "submitted",
                    amount_charged: 700.0,
                    currency: "NGN",
                    environment: "live",
                  },
                },
              },
            },
            "400": {
              description: "Validation Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "402": {
              description: "Insufficient Balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InsufficientBalanceResponse" },
                },
              },
            },
            "409": {
              description: "Duplicate Active Request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DuplicateRequestResponse" },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
            "503": {
              description: "Service Unavailable",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceUnavailableResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/validation/status": {
        get: {
          tags: ["NIN Validation"],
          summary: "Check NIN Validation Status",
          description:
            "Query the real-time processing status of a submitted NIN validation request using either `reference` or `client_reference`.\n\n" +
            "In both live and test modes, look up requests using the `reference` returned upon submission or your custom `client_reference`.",
          parameters: [
            {
              name: "reference",
              in: "query",
              required: false,
              description: "The primary Lorabiz platform reference returned upon submission (e.g., `nin_val_da7c1...`)",
              schema: { type: "string" },
              example: "nin_val_da7c1d16cd69891a7a9044",
            },
            {
              name: "client_reference",
              in: "query",
              required: false,
              description: "The custom reference you supplied when submitting the request",
              schema: { type: "string" },
              example: "REF_MY_APP_99182",
            },
          ],
          responses: {
            "200": {
              description: "Status query successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationStatusResponse" },
                  example: {
                    status: "success",
                    reference: "nin_val_da7c1d16cd69891a7a9044",
                    client_reference: "REF_MY_APP_99182",
                    nin: "18867568313",
                    validation_type: "no_record_found",
                    request_status: "validated",
                    message: "NIN Validation completed successfully.",
                    completed_at: "2026-09-09T08:35:12.000Z",
                    amount_charged: 700.0,
                    currency: "NGN",
                    environment: "live",
                    date: "2026-09-09T08:15:00.000Z",
                  },
                  examples: {
                    validated: {
                      summary: "Validated",
                      value: {
                        status: "success",
                        reference: "nin_val_da7c1d16cd69891a7a9044",
                        client_reference: "REF_MY_APP_99182",
                        nin: "18867568313",
                        validation_type: "no_record_found",
                        request_status: "validated",
                        message: "NIN Validation completed successfully.",
                        completed_at: "2026-09-09T08:35:12.000Z",
                        amount_charged: 700.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-09T08:15:00.000Z",
                      },
                    },
                    failed: {
                      summary: "Failed",
                      value: {
                        status: "error",
                        reference: "nin_val_da7c1d16cd69891a7a9044",
                        client_reference: "REF_MY_APP_99182",
                        nin: "18867568313",
                        validation_type: "no_record_found",
                        request_status: "failed",
                        message: "Your NIN Validation request has failed.",
                        error_detail: "Record could not be validated against national database.",
                        completed_at: null,
                        refunded: true,
                        amount_charged: 0.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-09T08:15:00.000Z",
                      },
                    },
                    processing: {
                      summary: "Processing",
                      value: {
                        status: "success",
                        reference: "nin_val_da7c1d16cd69891a7a9044",
                        client_reference: "REF_MY_APP_99182",
                        nin: "18867568313",
                        validation_type: "no_record_found",
                        request_status: "processing",
                        message: "NIN Validation request is currently processing.",
                        completed_at: null,
                        amount_charged: 700.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-09T08:15:00.000Z",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Missing required parameter",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                  example: {
                    status: "error",
                    code: "INVALID_QUERY",
                    message: "Provide reference or client_reference to look up status.",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "404": {
              description: "Validation Request Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordNotFoundResponse" },
                  example: {
                    status: "error",
                    code: "NOT_FOUND",
                    message: "No validation request found matching the specified identifier.",
                  },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/ipe": {
        post: {
          tags: ["NIMC IPE Clearance"],
          summary: "Submit NIMC IPE Clearance Request",
          description:
            "Submit an applicant's official NIMC Tracking ID for NIMC IPE Clearance (In-Processing Error clearance).\n\n" +
            "#### Sandbox Testing:\n" +
            "- `0TEB51VS5RES4ZZ`: Simulates success (transitions to `completed`, releasing `new_tracking_id` and `resolved_nin`).\n" +
            "- `0TBH26SQHQCR9F`: Simulates failure (transitions to `failed`, `refunded: true`).\n" +
            "- `0TDUPCONFLICT01`: Simulates duplicate conflict (HTTP 409).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tracking_id"],
                  properties: {
                    tracking_id: {
                      type: "string",
                      description: "Official NIMC Tracking ID (8 to 32 alphanumeric characters)",
                      example: "0TEB51VS5RES4ZZ",
                    },
                    client_reference: {
                      type: "string",
                      description: "Optional custom reference for idempotency and status queries",
                      example: "kyc_ipe_order_10029",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "IPE clearance request submitted successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IpeSubmitResponse" },
                  example: {
                    status: "success",
                    message: "NIMC IPE Clearance request submitted successfully.",
                    reference: "lora_ipe_1725934820123_xyz89",
                    tracking_id: "0TEB51VS5RES4ZZ",
                    client_reference: "kyc_ipe_order_10029",
                    request_status: "submitted",
                    amount_charged: 2500.0,
                    currency: "NGN",
                    environment: "live",
                  },
                },
              },
            },
            "400": {
              description: "Validation Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "402": {
              description: "Insufficient Balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InsufficientBalanceResponse" },
                },
              },
            },
            "409": {
              description: "Duplicate Active Request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DuplicateRequestResponse" },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
            "503": {
              description: "Service Unavailable",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceUnavailableResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/ipe/status": {
        get: {
          tags: ["NIMC IPE Clearance"],
          summary: "Check NIMC IPE Clearance Status",
          description:
            "Query the real-time status of an IPE clearance application using either `reference` or `client_reference`.\n\n" +
            "Status polling strictly uses `reference` or `client_reference` rather than the candidate `tracking_id` to prevent collision across retried submissions.",
          parameters: [
            {
              name: "reference",
              in: "query",
              required: false,
              description: "The primary Lorabiz platform reference returned upon submission",
              schema: { type: "string" },
              example: "lora_ipe_1725934820123_xyz89",
            },
            {
              name: "client_reference",
              in: "query",
              required: false,
              description: "The custom reference you supplied when submitting the request",
              schema: { type: "string" },
              example: "kyc_ipe_order_10029",
            },
          ],
          responses: {
            "200": {
              description: "Status query successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/IpeStatusResponse" },
                  example: {
                    status: "success",
                    reference: "lora_ipe_1725934820123_xyz89",
                    tracking_id: "0TEB51VS5RES4ZZ",
                    client_reference: "kyc_ipe_order_10029",
                    request_status: "completed",
                    message: "IPE Clearance completed successfully.",
                    new_tracking_id: "0T448N2SR7OFAZC",
                    resolved_nin: "44297896804",
                    completed_at: "2026-09-05T21:47:56.000Z",
                    amount_charged: 2500.0,
                    currency: "NGN",
                    environment: "live",
                    date: "2026-09-05T20:30:12.000Z",
                  },
                  examples: {
                    completed: {
                      summary: "Completed",
                      value: {
                        status: "success",
                        reference: "lora_ipe_1725934820123_xyz89",
                        tracking_id: "0TEB51VS5RES4ZZ",
                        client_reference: "kyc_ipe_order_10029",
                        request_status: "completed",
                        message: "IPE Clearance completed successfully.",
                        new_tracking_id: "0T448N2SR7OFAZC",
                        resolved_nin: "44297896804",
                        completed_at: "2026-09-05T21:47:56.000Z",
                        amount_charged: 2500.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-05T20:30:12.000Z",
                      },
                    },
                    failed: {
                      summary: "Failed",
                      value: {
                        status: "error",
                        reference: "lora_ipe_1725934820123_xyz89",
                        tracking_id: "0TBH26SQHQCR9F",
                        client_reference: "kyc_ipe_order_10029",
                        request_status: "failed",
                        message: "Your IPE Clearance request has failed.",
                        error_detail: "Your IPE clearance request has failed. Please contact support for more details.",
                        refunded: true,
                        completed_at: null,
                        amount_charged: 0.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-05T20:30:12.000Z",
                      },
                    },
                    processing: {
                      summary: "Processing",
                      value: {
                        status: "success",
                        reference: "lora_ipe_1725934820123_xyz89",
                        tracking_id: "0TEB51VS5RES4ZZ",
                        client_reference: "kyc_ipe_order_10029",
                        request_status: "processing",
                        message: "IPE Clearance request is currently processing.",
                        new_tracking_id: null,
                        resolved_nin: null,
                        completed_at: null,
                        amount_charged: 2500.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-05T20:30:12.000Z",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Missing required parameter",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                  example: {
                    status: "error",
                    code: "INVALID_QUERY",
                    message: "Provide reference or client_reference to look up status.",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "404": {
              description: "IPE Ticket Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordNotFoundResponse" },
                  example: {
                    status: "error",
                    code: "RECORD_NOT_FOUND",
                    message: "No IPE clearance ticket was found matching the provided reference under your account.",
                  },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/personalization": {
        post: {
          tags: ["NIMC NIN Personalization"],
          summary: "Submit NIMC Tracking ID for NIN Personalization",
          description:
            "Submit an applicant's NIMC Tracking ID for NIN Personalization to resolve their 11-digit NIN and personalized identification slip.\n\n" +
            "#### Sandbox Testing:\n" +
            "- `0TEB51VS5RES4ZZ`: Simulates success (transitions to `completed` in 5s with `resolved_nin`, `pdf_base64`, and demographics).\n" +
            "- `0TBH26SQHQCR9F`: Simulates failure (transitions to `failed` in 5s with `error_detail`).\n" +
            "- `0TDUPCONFLICT01`: Simulates duplicate conflict (HTTP 409 `DUPLICATE_REQUEST`).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["tracking_id"],
                  properties: {
                    tracking_id: {
                      type: "string",
                      description: "Official NIMC enrollment Tracking ID (alphanumeric string)",
                      example: "0TEB51VS5RES4ZZ",
                    },
                    client_reference: {
                      type: "string",
                      description: "Custom idempotency tracking string (max 128 chars)",
                      example: "kyc_pzn_1001",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Personalization request submitted successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PersonalizationSubmitResponse" },
                  example: {
                    status: "success",
                    message: "NIN Personalization request submitted successfully.",
                    reference: "lora_pzn_1725934820123_abc45",
                    tracking_id: "0TEB51VS5RES4ZZ",
                    client_reference: "kyc_pzn_1001",
                    request_status: "submitted",
                    amount_charged: 1500.0,
                    currency: "NGN",
                    environment: "live",
                  },
                },
              },
            },
            "400": {
              description: "Validation Error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "402": {
              description: "Insufficient Balance",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/InsufficientBalanceResponse" },
                },
              },
            },
            "409": {
              description: "Duplicate Active Request",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DuplicateRequestResponse" },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/nin/personalization/status": {
        get: {
          tags: ["NIMC NIN Personalization"],
          summary: "Check NIN Personalization Status",
          description:
            "Query the real-time status of a NIN personalization request using `reference` or `client_reference`.\n\n" +
            "**Tracking ID Rule**:\n" +
            "Querying status by `tracking_id` is strictly prohibited to prevent collisions across retried submissions. Status polling strictly accepts `reference` or `client_reference`.",
          parameters: [
            {
              name: "reference",
              in: "query",
              required: false,
              description: "Primary Lorabiz platform reference returned upon submission",
              schema: { type: "string" },
              example: "lora_pzn_1725934820123_abc45",
            },
            {
              name: "client_reference",
              in: "query",
              required: false,
              description: "Custom idempotency tracking reference supplied upon submission",
              schema: { type: "string" },
              example: "kyc_pzn_1001",
            },
          ],
          responses: {
            "200": {
              description: "Status query successful",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PersonalizationStatusResponse" },
                  example: {
                    status: "success",
                    reference: "lora_pzn_1725934820123_abc45",
                    tracking_id: "0TEB51VS5RES4ZZ",
                    client_reference: "kyc_pzn_1001",
                    request_status: "completed",
                    message: "NIN Personalization completed successfully.",
                    resolved_nin: "44297896804",
                    pdf_base64: "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK...",
                    data: {
                      nin: "44297896804",
                      firstname: "IBRAHIM",
                      surname: "MUSA",
                      middlename: "BELLO",
                      birthdate: "1995-04-12",
                      gender: "Male",
                      telephoneno: "08012345678",
                      residence_state: "Kano",
                      photo: "/9j/4AAQSkZJRg...",
                    },
                    completed_at: "2026-09-10T14:50:00.000Z",
                    amount_charged: 1500.0,
                    currency: "NGN",
                    environment: "live",
                    date: "2026-09-10T14:45:00.000Z",
                  },
                  examples: {
                    completed: {
                      summary: "Completed",
                      value: {
                        status: "success",
                        reference: "lora_pzn_1725934820123_abc45",
                        tracking_id: "0TEB51VS5RES4ZZ",
                        client_reference: "kyc_pzn_1001",
                        request_status: "completed",
                        message: "NIN Personalization completed successfully.",
                        resolved_nin: "44297896804",
                        pdf_base64: "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoK...",
                        data: {
                          nin: "44297896804",
                          firstname: "IBRAHIM",
                          surname: "MUSA",
                          middlename: "BELLO",
                          birthdate: "1995-04-12",
                          gender: "Male",
                          telephoneno: "08012345678",
                          residence_state: "Kano",
                          photo: "/9j/4AAQSkZJRg...",
                        },
                        completed_at: "2026-09-10T14:50:00.000Z",
                        amount_charged: 1500.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-10T14:45:00.000Z",
                      },
                    },
                    failed: {
                      summary: "Failed",
                      value: {
                        status: "error",
                        reference: "lora_pzn_1725934820123_abc45",
                        tracking_id: "0TBH26SQHQCR9F",
                        client_reference: "kyc_pzn_1001",
                        request_status: "failed",
                        message: "Your NIN Personalization request has failed.",
                        error_detail: "Tracking ID could not be resolved or was rejected by identity authority.",
                        completed_at: null,
                        refunded: false,
                        amount_charged: 1500.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-10T14:45:00.000Z",
                      },
                    },
                    processing: {
                      summary: "Processing",
                      value: {
                        status: "success",
                        reference: "lora_pzn_1725934820123_abc45",
                        tracking_id: "0TEB51VS5RES4ZZ",
                        client_reference: "kyc_pzn_1001",
                        request_status: "processing",
                        message: "Your NIN Personalization request is currently processing. Please check back later.",
                        completed_at: null,
                        amount_charged: 1500.0,
                        currency: "NGN",
                        environment: "live",
                        date: "2026-09-10T14:45:00.000Z",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Missing reference parameter or invalid query",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                  example: {
                    status: "error",
                    code: "INVALID_QUERY",
                    message: "Provide reference or client_reference to look up status. Polling by tracking_id is not permitted.",
                  },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UnauthorizedErrorResponse" },
                },
              },
            },
            "404": {
              description: "Personalization Ticket Not Found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordNotFoundResponse" },
                  example: {
                    status: "error",
                    code: "RECORD_NOT_FOUND",
                    message: "No NIN personalization ticket was found matching the provided reference under your account.",
                  },
                },
              },
            },
            "429": {
              description: "Too Many Requests",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  };
}
