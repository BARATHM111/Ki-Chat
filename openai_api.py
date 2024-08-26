import openai
from config import Config

# Set up OpenAI API key
openai.api_key = Config.OPENAI_API_KEY

def generate_openai_response(system_message, user_prompt):
    """Generate a response from the OpenAI API."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message['content']
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None
