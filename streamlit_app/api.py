
def _read_api_url() -> str:
    """Read the backend URL from Streamlit Secrets, environment, or fallback."""

    # 1. Streamlit Cloud Secrets
    try:
        import streamlit as st

        configured = st.secrets.get("API_URL")
        if configured:
            return str(configured).strip().rstrip("/")
    except Exception:
        pass

    # 2. Environment variable
    configured = os.environ.get("API_URL")
    if configured:
        return configured.strip().rstrip("/")

    # 3. Production backend fallback
    return "https://financial-parallelverse.onrender.com/api/v1"
