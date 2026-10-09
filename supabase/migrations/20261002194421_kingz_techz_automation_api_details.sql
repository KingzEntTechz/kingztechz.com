/*
# Kingz Techz - Automation API Details

1. Modified Tables
- `automation_settings`: add API type, API name, username, provider status, and synchronization feature switches matching the requested provider configuration screen.

2. Security
- Access keys are deliberately not stored in this table or exposed to the browser.
- The future sync worker must read the provider key from a server-side secret and use an authenticated administrator action.
- Existing administrator-only row policies remain in force.

3. Important Notes
- The existing provider URL and cron controls remain unchanged.
- No external API call is made until a server-side key and provider response format are approved.
*/

ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS api_type text NOT NULL DEFAULT 'GSM Theme';
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS api_name text NOT NULL DEFAULT '';
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '';
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'inactive';
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS auto_update_price boolean NOT NULL DEFAULT true;
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS auto_update_quantity boolean NOT NULL DEFAULT true;
ALTER TABLE public.automation_settings ADD COLUMN IF NOT EXISTS auto_update_delivery boolean NOT NULL DEFAULT true;
ALTER TABLE public.automation_settings DROP CONSTRAINT IF EXISTS automation_provider_status_check;
ALTER TABLE public.automation_settings ADD CONSTRAINT automation_provider_status_check CHECK (provider_status IN ('active', 'inactive'));
