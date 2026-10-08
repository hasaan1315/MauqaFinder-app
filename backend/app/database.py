import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

url: str = os.getenv("SUPABASE_URL", "").strip().strip('"').strip("'")
key: str = os.getenv("SUPABASE_KEY", "").strip().strip('"').strip("'")

# Debug output to verify active credentials
print(f"DEBUG: Loaded SUPABASE_URL = '{url}'")
print(f"DEBUG: Loaded SUPABASE_KEY length = {len(key)} | Key prefix = '{key[:12]}...'")

if not url or not key:
    raise ValueError(f"Missing Supabase configuration at {env_path}")

supabase: Client = create_client(url, key)