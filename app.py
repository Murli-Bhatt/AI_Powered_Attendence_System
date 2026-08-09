# SnapClass Root Launcher
# Executes the Streamlit Frontend application from frontend/app.py

import sys
import os

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Run frontend application
import frontend.app
