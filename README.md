# Lumebiz 🚀

Lumebiz is a comprehensive, automated business registration and management platform built to streamline Corporate Affairs Commission (CAC) processes. It provides an intuitive dashboard for users to register business names, manage internal wallets, and track applications with the help of AI-driven categorization.

## 🛠 Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/) (OTP based)
* **UI Components:** shadcn/ui & Radix Primitives

## ✨ Key Features

* **Multi-Step CAC Registration:** A seamless workflow for submitting company details, proprietor information, and required documentation.
* **AI Category Assistant:** Intelligent prompt-based helper to guide users in selecting the exact, compliant CAC business categories.
* **Integrated Wallet System:** Built-in user wallets allowing users to fund their accounts, track balances, and pay for services smoothly.
* **Payment Gateway Integration:** Automated checkout, receipt generation, and secure webhook handling.
* **Query & Dashboard Management:** Real-time tracking of application statuses and a dedicated interface for handling queries and corrections.

## 📂 Project Structure

\`\`\`bash
├── prisma/                  # Database schema and seed scripts
├── public/                  # Static assets and icons
├── src/
│   ├── app/                 # Next.js App Router (Pages & API Routes)
│   │   ├── api/             # Backend endpoints (AI, Auth, CAC, Payments, Upload)
│   │   ├── auth/            # Login and Registration views
│   │   └── dashboard/       # Main user dashboard and nested routing
│   ├── components/          # React Components
│   │   ├── dashboard/       # Complex dashboard-specific modules (Registration, Wallet)
│   │   └── ui/              # Reusable, atomic UI components (Buttons, Inputs, Cards)
│   └── lib/                 # Utility functions, Prisma client, and configurations
\`\`\`

## 🚀 Getting Started

### Prerequisites
Ensure you have Node.js (v18+) and npm installed. You will also need access to a PostgreSQL database.

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-username/lumebiz.git
   cd lumebiz
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup:**
   Create a `.env` file in the root directory and configure the required environment variables:
   \`\`\`env
   DATABASE_URL="postgresql://user:password@localhost:5432/lumebiz"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   # Add your specific Payment Gateway and AI API keys here
   \`\`\`

4. **Database Migration:**
   Push the Prisma schema to your database and generate the client:
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   # Optional: Run the seed script to populate initial data
   # npx prisma db seed
   \`\`\`

5. **Run the Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the issues page.
