-- Migrate existing tools that have login_email/login_password but no tool_logins rows
INSERT INTO tool_logins (tool_id, login_email, login_password, status)
SELECT t.id, t.login_email, t.login_password, 'available'
FROM tools t
WHERE t.login_email IS NOT NULL
  AND btrim(t.login_email) <> ''
  AND t.remote_connect IS NULL
  AND NOT EXISTS (SELECT 1 FROM tool_logins tl WHERE tl.tool_id = t.id);
