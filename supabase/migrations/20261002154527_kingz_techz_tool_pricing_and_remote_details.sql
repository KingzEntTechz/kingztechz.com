/*
# Kingz Techz - Tool Pricing and Remote Details

1. Modified Tables
- `rentals`: add optional AnyDesk ID, UltraViewer ID, and UltraViewer password fields so customers can provide the connection details requested for a tool.
- `tools`: retain separate USD and KES prices so administrators can enter both values independently; existing USDT-rate conversion remains available as a fallback for older tools.

2. Security
- Existing RLS policies remain in place.
- Rental connection details are protected by the existing authenticated owner/admin rental policies.

3. Important Notes
- AnyDesk tools use only `anydesk_id`.
- UltraViewer tools use `ultraviewer_id` and `ultraviewer_password`.
- Existing records are preserved and new fields are nullable.
*/

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS anydesk_id text DEFAULT '';
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS ultraviewer_id text DEFAULT '';
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS ultraviewer_password text DEFAULT '';

ALTER TABLE tools ALTER COLUMN price_kes SET DEFAULT 0;
