import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Automatically load environment variables from .env file
load_dotenv()

def init_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "https://your-supabase-project-id.supabase.co")
    key = os.getenv("SUPABASE_KEY", "your-supabase-anon-key")
    return create_client(url, key)

supabase: Client = init_supabase()
