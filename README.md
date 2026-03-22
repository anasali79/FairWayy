## Golf Charity Subscription Platform (PRD-based)

This is a Next.js (App Router) web app for the **Golf Charity Subscription Platform**.

### Stack
- **Supabase** (auth + Postgres + RLS). Run `supabase/setup.sql` in your project SQL editor.
- **Stripe** (optional): set env vars + webhook; `NEXT_PUBLIC_STRIPE_MODE=mock` skips checkout.
- **Fallback**: `src/lib/mock/seedCharities.ts` fills charity dropdown if the DB is empty.

## Getting Started

### Run the app

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open `http://localhost:3000` with your browser.

### Accounts
- **Subscriber**: `/auth/signup` (or `/subscription` → plans).
- **Admin**: create a user in Supabase, set `golf_profiles.role = 'admin'`, or use `/auth/admin-signup` if configured.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for font optimization.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
