# Getting Started with ELITE

> Quick start guide for developers

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Redis instance
- Odoo 17 instance (optional for development)
- Resend account for emails

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/Hamdysaad20/ELITE.git
cd ELITE
```

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/elite"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="ELITE <noreply@yourdomain.com>"

# Redis (Upstash)
REDIS_URL="redis://default:xxxxx@host:port"

# Odoo (optional)
ODOO_URL="https://your-odoo.com"
ODOO_DB="your_db"
ODOO_USERNAME="admin@domain.com"
ODOO_PASSWORD="password"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxx"

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="xxxxx"
CLOUDINARY_API_SECRET="xxxxx"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
ELITE/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── auth/         # Auth pages
│   │   ├── menu/         # Menu pages
│   │   ├── orders/       # Order pages
│   │   └── profile/      # Profile pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   └── server/           # Server-side code
│       ├── services/     # Business logic
│       ├── queues/       # Bull queues
│       └── utils/        # Utilities
├── prisma/               # Database schema
├── public/               # Static files
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── .ai-workspace/        # AI temp workspace
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code patterns
- Write TypeScript types
- Add error handling
- Update tests if needed

### 3. Test Locally
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Test
npm run test
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add your feature"
```

### 5. Push & Create PR
```bash
git push origin feature/your-feature-name
```

---

## Common Tasks

### Add New API Route
```typescript
// src/app/api/example/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ data: "success" });
}
```

### Add New Database Model
```prisma
// prisma/schema.prisma
model Example {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
npx prisma migrate dev --name add_example_model
npx prisma generate
```

### Add New Component
```typescript
// src/components/Example.tsx
import { FC } from "react";

interface ExampleProps {
  title: string;
}

const Example: FC<ExampleProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default Example;
```

---

## Testing

### Run Test Suite
```bash
# All tests
npm run test

# Specific test
npx tsx scripts/test-odoo-sync.ts
```

### Manual Testing
- Test authentication flows
- Test order placement
- Test Odoo sync
- Test mobile responsiveness
- Test error scenarios

---

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

---

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache
rm -rf .next
npm run build
```

**Database Connection Issues**
```bash
# Test connection
npx prisma db push
```

**Type Errors**
```bash
# Regenerate Prisma client
npx prisma generate
```

**Redis Connection Issues**
- Verify REDIS_URL is correct
- Check Upstash dashboard

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Search [GitHub Issues](https://github.com/Hamdysaad20/ELITE/issues)
- Create new issue for bugs

---

## Next Steps

1. ✅ Set up development environment
2. ✅ Run local server
3. 📖 Read [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)
4. 📖 Review [API_REFERENCE.md](./API_REFERENCE.md)
5. 🚀 Start building!
