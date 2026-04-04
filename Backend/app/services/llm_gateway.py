import os
import json
from litellm import completion
from dotenv import load_dotenv

load_dotenv()

# Default to Gemini if not specified
# Formats: "gemini/gemini-2.5-flash", "openai/gpt-4o", "anthropic/claude-3-5-sonnet"
LLM_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-2.5-flash")

def chat_completion(messages, tools=None, tool_choice=None, response_format=None):
    """
    A unified interface for chat completions across different LLM providers.
    Uses LiteLLM under the hood to normalize requests/responses.
    """
    # Force reload env to catch changes to LLM_MODEL without restart
    load_dotenv()
    model = os.getenv("LLM_MODEL", "gemini/gemini-2.5-flash")

    try:
        kwargs = {
            "model": model,
            "messages": messages,
        }
        
        if tools:
            kwargs["tools"] = tools
        if tool_choice:
            kwargs["tool_choice"] = tool_choice
        if response_format:
            kwargs["response_format"] = response_format

        response = completion(**kwargs)
        return response
    except Exception as e:
        print(f"LLM Gateway Error: {str(e)}")
        raise e

def parse_json_response(response):
    """
    Helper to extract and parse JSON from an LLM response.
    """
    content = response.choices[0].message.content
    try:
        # Strip potential markdown code blocks
        clean_content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_content)
    except Exception:
        # Simple extraction if JSON parsing fails directly
        import re
        json_match = re.search(r'\{.*\}', clean_content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        raise ValueError("Could not parse JSON from LLM response")
