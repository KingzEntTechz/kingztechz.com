/*
# Kingz Techz - Delivery Mode and Payment Contact Settings

1. Modified Tables
- `tools`: add `delivery_mode`, limited to `instant` or `minutes`, so administrators can control the delivery label shown beneath each tool duration.
- `site_settings`: add `mpesa_number` for the M-Pesa payment destination while keeping the existing WhatsApp number for WhatsApp, Airtel Money, and Binance contact flows.

2. Security
- Existing tools administrator write policies remain unchanged.
- Existing site settings administrator update policy remains unchanged.
- Delivery mode is constrained at the database boundary to the two supported values.

3. Important Notes
- Existing tools default to `instant` and keep their current storefront appearance.
- Existing WhatsApp and Airtel/Binance settings continue using `whatsapp_number`.
- The M-Pesa number is shown only in payment method information.
*/

ALTER TABLE tools ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'instant';
ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_delivery_mode_check;
ALTER TABLE tools ADD CONSTRAINT tools_delivery_mode_check CHECK (delivery_mode IN ('instant', 'minutes'));

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS mpesa_number text NOT NULL DEFAULT '0707398858';
