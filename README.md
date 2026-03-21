## Golf Charity Subscription Platform (PRD-based)

This is a Next.js (App Router) web app for the **Golf Charity Subscription Platform**.

### Important (current version)
This version is **fully working using a mock data layer** (LocalStorage):
- Mock authentication (email/password in LocalStorage)
- Mock subscriptions (renewal date is simulated)
- Mock draw engine (admin can run/publish monthly draws)
- Mock winner verification (users upload proof image; admin approves/rejects)

Real Supabase + Stripe integration still needs to be connected (I’m keeping the code structure modular for that next step).

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

### Demo admin account (mock)
Use this login to access `/admin`:
- Email: `rekiriy134@isfew.com`
- Password: `123456`

### Demo subscriber account
- Use `/auth/signup` to create a subscriber account.

### Next step to make it “production real”
Connect Supabase + enable Stripe + replace the mock DB layer with real tables/RLS + Edge Functions.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
