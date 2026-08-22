"""Who may call this deployment."""

import os

from managed_deepagents import auth, define_identity

# Your app's users sign in with Supabase and send `Authorization: Bearer
# <access_token>`. MDA verifies the JWT against the project's JWKS and gives
# each caller private threads. By default `auth.supabase()` maps the
# caller's verified *email* to `runtime.identity["user"]["id"]`, which
# tools/journal.py uses to scope each person's journal to them.
#
# Set SUPABASE_PROJECT_REF in `.env` to your project's ref (the subdomain in
# https://<project_ref>.supabase.co). The client must sign in with the
# Supabase *publishable/anon* key — never a LangSmith key in this mode.
identity = define_identity(
    auth=auth.supabase(project_ref=os.environ["SUPABASE_PROJECT_REF"]),
)
