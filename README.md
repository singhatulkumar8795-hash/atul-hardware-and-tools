# Atul Hardware and Tools

Static COD storefront for Atul Hardware and Tools, Purshipurwa.

## Run locally

Open `index.html` in a browser. No build step or package installation is required.

## Publish free on Netlify

1. Open [Netlify Drop](https://app.netlify.com/drop).
2. Drag this project folder into the page.
3. Netlify will provide a public URL.

## Publish free on Vercel

1. Open [Vercel](https://vercel.com) and sign in with GitHub.
2. Import this folder/repository.
3. Keep the default settings and deploy.

The storefront works locally with browser storage and can sync shared products and COD orders through Supabase. Customer profiles and saved addresses remain on the customer's device; admin order access is protected by Supabase email/password authentication.

## Enable cloud data

1. Open the Supabase SQL Editor and run the complete `schema.sql` file. It is safe to run again if a previous attempt stopped on a duplicate-policy error.
2. Run `seed.sql` to load the starter products.
3. The public storefront can read active products and create COD orders.
4. Order reads are intentionally not public because customer phone numbers and addresses must stay private. Add authenticated admin access before enabling an online order dashboard.
5. Run `security-migration.sql` after creating an admin user in Supabase Authentication. This also adds the product image column and repeat-safe admin policies.
6. Open the site, use the footer **Admin panel**, and sign in with that Supabase admin account.
7. Add or edit a product from the admin panel, then place one test COD order to confirm the complete cloud flow.

## Publish checklist

- Run both SQL files completely in the Supabase SQL Editor.
- Confirm the product image column exists before adding image URLs.
- Test admin sign-in, product editing, order status updates and sign-out.
- Test customer profile, multiple saved addresses and COD checkout on mobile.
- Do not place service-role keys in frontend files; only use the public anon key.

If an order appears only on the customer's phone, check that `schema.sql` and `security-migration.sql` were run completely and redeploy the latest website files. The checkout now reports when an order could only be saved locally.
