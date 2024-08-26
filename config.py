from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    DB_HOST = os.getenv("DB_HOST")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME")

# Debugging print statements
print(f"FLASK_ENV: {Config.FLASK_ENV}")
print(f"OPENAI_API_KEY: {Config.OPENAI_API_KEY}")
