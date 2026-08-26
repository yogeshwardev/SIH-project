import os
import re
import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filenames to prevent directory traversal or unsafe characters."""
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    unique_prefix = uuid.uuid4().hex[:8]
    return f"{unique_prefix}_{clean_name}"

def safe_json_loads(json_str: Optional[str], default: Any = None) -> Any:
    """Safely parse a JSON string, returning default if invalid or None."""
    if not json_str:
        return default if default is not None else []
    try:
        return json.loads(json_str)
    except Exception:
        return default if default is not None else []

def safe_json_dumps(data: Any) -> str:
    """Serialize data to JSON string safely."""
    try:
        return json.dumps(data, ensure_ascii=False)
    except Exception:
        return "[]"

def format_currency_inr(amount: float) -> str:
    """Format number into Indian Rupee currency format (e.g., ₹2,499)."""
    return f"₹{amount:,.0f}"
