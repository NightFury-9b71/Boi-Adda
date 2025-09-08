#!/usr/bin/env python3

import uvicorn
import os
import sys
from pathlib import Path

# Add the parent directory to Python path to make backend package importable
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
