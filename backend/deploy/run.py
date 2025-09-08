#!/usr/bin/env python3

import uvicorn
import os
import sys
from pathlib import Path

# Add the current directory to Python path to ensure imports work
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    
    # Try different import paths for different deployment environments
    app_modules = ["main:app", "backend.main:app"]
    
    for app_module in app_modules:
        try:
            uvicorn.run(app_module, host="0.0.0.0", port=port, reload=False)
            break
        except ModuleNotFoundError as e:
            print(f"Failed to import {app_module}: {e}")
            continue
    else:
        print("Could not import the FastAPI app. Check your module structure.")
        sys.exit(1)
