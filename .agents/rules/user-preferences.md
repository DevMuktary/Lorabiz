---
trigger: always_on
---

# User Coding Preferences & Architectural Guidelines

1. **NEVER Use Personal User Names in Code**:
   - Strictly avoid using "Mukhtar" or real user personal details as mock data, test fixtures, input placeholders, or default fallback strings anywhere in the codebase.
   - Always use standard generic names (e.g. "John", "Jane", "Alex", "Doe", "Smith", or "User").

2. **No Artificial AI-Sounding Badges or Copy**:
   - Avoid generic AI marketing badges and clunky slogans such as "Fast & Secure Onboarding", "Bank-Grade Security", "Instant Verification", or artificial "verified" shield banners.
   - Maintain a human, professional, sleek, and authentic tone.

3. **Concise Subtitles & Helper Text**:
   - Keep screen subtitles and field descriptions short and natural (e.g. focusing on customer support, account updates, or straightforward instructions).

4. **Transparent Field Validation**:
   - When inputs (such as password and confirm password) fail validation, always show a clear text explanation (e.g. "Passwords do not match") rather than simply coloring a box red without explanation.

5. **NEVER Hardcode Configs, Secrets, or Dynamic URLs**:
   - Strictly avoid hardcoding URLs, endpoints, credentials, or environment-specific values in source code.
   - Always read configuration from environment variables (e.g., `process.env.EXPO_PUBLIC_API_URL`, `process.env.NEXTAUTH_URL`) or appropriate database / secret stores.
   - Ensure environment variables are cleanly consumed across development, staging, and production environments without needing manual code edits.

