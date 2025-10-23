#!/usr/bin/env python3
"""
Test script to verify app.py imports correctly
"""
try:
    from app import app
    print("SUCCESS: Successfully imported Flask app from app.py")
    print(f"App name: {app.name}")
    print(f"App routes: {[rule.rule for rule in app.url_map.iter_rules()]}")
except ImportError as e:
    print(f"FAILED to import app: {e}")
except Exception as e:
    print(f"ERROR: {e}")
