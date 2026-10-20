This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Password policy

Signup and login use the shared `components/PasswordInput.tsx` component and the
policy defined in `lib/password.ts`:

| Rule | Value |
| --- | --- |
| Minimum length | 8 characters |
| Maximum length | 72 characters (bcrypt truncates beyond this) |
| Character classes | uppercase `A-Z`, lowercase `a-z`, digit `0-9`, and one special character from ``!@#$%^&*()-_=+[]{};.,<>/?~`` |

`lib/password.ts` exports `SUPABASE_PASSWORD_REQUIRED_CHARACTERS`, the exact
value that must be configured on the server (see below).

### Required server-side configuration

The client-side check is advisory UX only and is trivially bypassed. The real
policy must be enforced by Supabase Auth, otherwise a 6-character password is
still accepted over the API.

**Dashboard:** Authentication -> Providers -> Email -> "Password" section.

**Or Management API** (requires a personal access token, not the anon key):

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/<project-ref>/config/auth" \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "password_min_length": 8,
    "password_required_characters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ:abcdefghijklmnopqrstuvwxyz:0123456789:!@#$%^&*()-_=+[]{};.,<>/?~",
    "password_hibp_enabled": true
  }'
```

Note: `password_required_characters` is a colon-separated list of **literal**
character sets. GoTrue uses `strings.ContainsAny`, so `A-Z` does not mean "an
uppercase letter" - it means "one of the literal characters `A`, `-` or `Z`".
Always spell out the full alphabet.

`password_hibp_enabled` blocks passwords found in known breaches (requires the
Breach Password Protection add-on to be enabled on the project).

## Getting Started

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
