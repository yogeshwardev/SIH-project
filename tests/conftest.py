"""Keep the test run out of the working catalogue.

The suite creates products, orders and bulk requests. Without this, those rows
land in backend/craftlink.db — the database the running app and the demo
catalogue use — and test listings show up in the storefront.
"""
import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "craftlink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"

# Model preloading downloads and loads AI models; the suite stubs what it needs.
os.environ.setdefault("IMAGE_MODEL_PRELOAD", "false")
os.environ.setdefault("VOICE_MODEL_PRELOAD", "false")
