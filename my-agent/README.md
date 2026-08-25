# my-agent

A CBT/DBT-grounded emotional support coach, built as a Managed Deep Agent
with [`managed-deepagents`](https://github.com/langchain-ai/managed-deepagents-sdk).
It helps with in-the-moment emotional regulation and keeps a private,
per-user journal built around the core CBT move: each check-in records the
automatic thought behind the feeling, which recognized thinking pattern(s)
it fits (a fixed taxonomy in `tools/patterns.py`), the reframe, and a
tailored affirmation to come back to — so people (and the agent) can
notice which thought keeps returning, not just how moods move around.

## Project structure

```text
my-agent/
  agent.py                 # define_deep_agent(...) — required `name` is the deploy id
  instructions.md          # CBT/DBT coaching behavior + crisis-safety protocol
  pyproject.toml           # project dependencies
  .env                     # API keys (LangSmith, model, Supabase); never commit
  identity.py              # Supabase auth — private threads per signed-in user
  tools/journal.py         # log_emotion_entry / get_emotion_progress
  tools/patterns.py        # thinking-pattern taxonomy (mirrored in web/src/lib/patterns.ts)
  supabase/schema.sql      # emotion_journal_entries table + RLS policy
  middleware/               # optional middleware
  skills/                   # optional skills synced to Context Hub
```

No `sandbox/` — this agent only talks and calls the Supabase REST API, it
never writes files or runs code. No `memory.py` either: MDA's managed
memory is one tree shared by *every* caller of the deployment, which
doesn't fit a private per-user journal, so Supabase Postgres is used
instead (see `tools/journal.py`).

## Install

```bash
uv sync
```

## Set up Supabase

1. Create a Supabase project (or use an existing one).
2. Run `supabase/schema.sql` against it (SQL Editor, or `supabase db push`).
3. Fill in `.env`: `SUPABASE_PROJECT_REF`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (all under Project Settings > API), plus
   `LANGSMITH_API_KEY` and your model provider's key (see `agent.py` for
   which one — currently an OpenCode Go key, `OPENCODE_GO_API_KEY`).
4. Your client app signs users in with Supabase and calls this deployment
   with `Authorization: Bearer <access_token>` using the *publishable/anon*
   key to sign in — never the service role key or a LangSmith key from the
   client.

## Evaluate

Managed Deep Agent evals are Harbor evals. Author full Harbor tasks directly under
`evals/tasks/<task>/`. To start from a minimal task, run:

```bash
mda evals init my-task
```

This creates the optional scaffold `evals/scaffold/my-task/` with an `instruction.md` and a language
verifier. Run the same command with another name to add more scaffolds. At compile
time MDA copies selected scaffolds to `evals/tasks/` and preserves
every other task. Compile the managed agent, then run Harbor yourself:

```bash
mda evals compile ./my-agent                  # all tasks
mda evals compile ./my-agent --task my-task   # only my-task
# follow the printed `harbor run` command
```

## Develop

Edit `agent.py` to configure your model, tools, and middleware, and edit
`instructions.md` to shape the system prompt.

Run the compiled app on the local LangGraph dev server:

```bash
mda dev
```

For Python projects, `mda dev` requires `uv` on `PATH`, but it resolves the local LangGraph dev server automatically; you do not need to install a global `langgraph` command.

## Identity

`identity.py` uses `auth.supabase(project_ref=...)`: MDA verifies each
caller's Supabase session JWT and gives them private threads. The caller's
verified email becomes `runtime.identity["user"]["id"]`, which
`tools/journal.py` uses to scope every journal entry to its owner.

## Memory

This project declares no `memory.py` on purpose. MDA's managed memory is
one `/memories/agent/` tree shared by every caller of the deployment — fine
for shared knowledge, wrong for a private per-user journal. The journal
lives in Supabase Postgres instead (`tools/journal.py`,
`supabase/schema.sql`), scoped per user via `identity.py`.

## Deploy

Compile and deploy the project to LangSmith:

```bash
mda deploy
```

This copies your files verbatim, generates a managed entry module, and writes a
deployable build (including `langgraph.json`) to `.mda/build`. The CLI uploads
that build to LangSmith to run your agent on the managed runtime.

Common options:

```bash
mda deploy --name my-agent-dev --deployment-type dev
mda deploy --workspace-id "$LANGSMITH_WORKSPACE_ID"
mda deploy --no-wait
```

Deploy prints both the Agent Server URL to call and the LangSmith dashboard URL
to inspect.

## Logs

Read the deployed agent's server logs:

```bash
mda logs
mda logs --lines 200 --level error
```

In a terminal this streams new output until you press Ctrl-C. When the output is
piped or redirected it prints the most recent lines (1000 by default) and exits.

## Delete

Remove the deployment and the LangSmith resources it created:

```bash
mda delete
```

This deletes the deployment, the tracing project created alongside it, the
Context Hub repo holding this agent's context and memory, and the managed
sandboxes this agent created. It asks first; pass `--yes` to skip the prompt.
Agent memory and thread history are not recoverable afterwards.

## Environment

`mda deploy` loads `.env`, uses `LANGSMITH_API_KEY` for LangSmith, and forwards
non-reserved keys — `OPENCODE_GO_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, etc. — as deployment secrets. Keys must be in
`.env` or configured as LangSmith workspace secrets — a value exported in
your shell is not read. Set `LANGSMITH_WORKSPACE_ID` or pass
`--workspace-id` if your LangSmith API key requires a workspace selection.
