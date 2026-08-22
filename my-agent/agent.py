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
)
