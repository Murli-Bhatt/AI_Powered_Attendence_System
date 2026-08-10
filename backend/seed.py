"""
SnapClass Database Seeding & Setup Script
Verifies connection to Supabase and populates initial sample data if required.
"""

import sys
import os

# Set UTF-8 encoding for Windows console output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure root workspace directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.config import supabase
from backend.database.db import register_teacher, teacher_exists

def seed_database():
    print("[*] Connecting to Supabase Database...")
    
    url = os.getenv("SUPABASE_URL", "")
    if "your-supabase-project-id" in url or not url:
        print("[!] Notice: Placeholder Supabase credentials found in .env")
        print("[i] To connect to a live Supabase database, update SUPABASE_URL and SUPABASE_KEY in your .env file.")
        print("[+] Setup check complete!")
        return

    try:
        demo_username = "teacher_demo"
        if not teacher_exists(demo_username):
            print(f"[+] Registering demo teacher: '{demo_username}'...")
            res = register_teacher(demo_username, "password123", name="Dr. Alex Vance")
            if res["success"]:
                print("[+] Demo teacher created successfully! (Username: teacher_demo / Password: password123)")
            else:
                print(f"[!] Note: {res.get('error')}")
        else:
            print("[i] Demo teacher 'teacher_demo' already exists in database.")

        print("[+] Database check & seed complete!")

    except Exception as e:
        print(f"[!] Connection check note: {str(e)}")
        print("[i] Please update SUPABASE_URL and SUPABASE_KEY in your .env file with your project keys.")

if __name__ == "__main__":
    seed_database()
