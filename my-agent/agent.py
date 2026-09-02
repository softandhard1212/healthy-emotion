import os

from langchain_openai import ChatOpenAI
from managed_deepagents import define_deep_agent

from tools.journal import get_emotion_progress, log_emotion_entry

# OpenCode Go: a flat-rate gateway proxying to 18 models behind an
# OpenAI-compatible endpoint. Not a recognized `provider:model` string for
# MDA's model resolution, so it's passed as a configured chat model instance
# instead — see managed-deep-agents skill: "Pass a chat model instance
# instead of a string when you need to configure model parameters in code."
model = ChatOpenAI(
    # Raw API calls drop the "opencode-go/" prefix used in OpenCode's own
    # TUI config — the bare model id is what the endpoint expects.
    model="ox-alpha-free",
    base_url="https://opencode.ai/zen/go/v1",
    api_key=os.environ["OPENCODE_GO_API_KEY"],
)

agent = define_deep_agent(
    name="my-agent",
    model=model,
    tools=[log_emotion_entry, get_emotion_progress],
    # The default middleware stack always includes Anthropic's prompt-caching
    # middleware, regardless of provider. Against this OpenAI-compatible
    # model it builds a header containing raw prose (looks like the system
    # prompt) instead of an Anthropic cache-control header, which crashes
    # with a UnicodeEncodeError the moment that prose has an em dash or
    # curly quote in it — both of which instructions.md is full of. This
    # agent has no need for prompt caching, filesystem, or subagent
    # middleware (no sandbox, no delegated subagents), so the whole default
    # stack is replaced rather than patched around.
    middleware=[],
)
