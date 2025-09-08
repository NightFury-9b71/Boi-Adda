#!/usr/bin/env python3
"""
Deployment script that fixes imports for Render deployment
"""

import os
import shutil
import re
from pathlib import Path

def fix_imports_for_deployment():
    """Convert relative imports to absolute imports for deployment"""
    
    # Create a deployment directory
    deploy_dir = Path("deploy")
    if deploy_dir.exists():
        shutil.rmtree(deploy_dir)
    
    # Copy all files to deployment directory
    shutil.copytree(".", deploy_dir, ignore=shutil.ignore_patterns("deploy", "__pycache__", "*.pyc", ".git"))
    
    # Files to fix
    files_to_fix = [
        deploy_dir / "main.py",
        deploy_dir / "auth.py", 
        deploy_dir / "users.py",
        deploy_dir / "seed_data.py"
    ]
    
    # Add all router files
    router_dir = deploy_dir / "routers"
    if router_dir.exists():
        files_to_fix.extend(router_dir.glob("*.py"))
    
    # Fix imports in each file
    for file_path in files_to_fix:
        if file_path.exists() and file_path.name != "__init__.py":
            fix_imports_in_file(file_path)
    
    print(f"Deployment files created in {deploy_dir}")

def fix_imports_in_file(file_path):
    """Fix relative imports in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace relative imports
    # ..models -> models
    content = re.sub(r'from \.\.models', 'from models', content)
    # ..schemas -> schemas  
    content = re.sub(r'from \.\.schemas', 'from schemas', content)
    # ..enums -> enums
    content = re.sub(r'from \.\.enums', 'from enums', content)
    # ..database -> database
    content = re.sub(r'from \.\.database', 'from database', content)
    # ..auth -> auth
    content = re.sub(r'from \.\.auth', 'from auth', content)
    
    # Single dot imports
    content = re.sub(r'from \.models', 'from models', content)
    content = re.sub(r'from \.schemas', 'from schemas', content)
    content = re.sub(r'from \.enums', 'from enums', content)
    content = re.sub(r'from \.database', 'from database', content)
    content = re.sub(r'from \.auth', 'from auth', content)
    content = re.sub(r'from \.seed_data', 'from seed_data', content)
    
    # Router imports
    content = re.sub(r'from \.routers', 'from routers', content)
    
    # Backend module imports (for deployment)
    content = re.sub(r'from backend\.models', 'from models', content)
    content = re.sub(r'from backend\.schemas', 'from schemas', content)
    content = re.sub(r'from backend\.enums', 'from enums', content)
    content = re.sub(r'from backend\.database', 'from database', content)
    content = re.sub(r'from backend\.auth', 'from auth', content)
    content = re.sub(r'from backend\.seed_data', 'from seed_data', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed imports in {file_path}")

if __name__ == "__main__":
    fix_imports_for_deployment()
