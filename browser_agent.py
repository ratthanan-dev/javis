import os
import json
import time
from typing import Dict, Any, List, Optional
import sandbox_manager as sm

# Playwright will be dynamically imported so system doesn't fail if not yet installed
_playwright = None
_browser = None
_context = None
_page = None

SESSION_FILE = os.path.join(sm.SESSIONS_DIR, "browser_state.json")


def _get_page(headless: bool = True):
    """Ensure a browser page instance is active, starting one if needed."""
    global _playwright, _browser, _context, _page
    from playwright.sync_api import sync_playwright

    if _page is not None and not _page.is_closed():
        return _page

    if _playwright is None:
        _playwright = sync_playwright().start()

    if _browser is None:
        # Launch Chromium (defaults to headless, but can be headed)
        _browser = _playwright.chromium.launch(
            headless=headless,
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )

    # Load session state if available
    context_options = {
        "viewport": {"width": 1280, "height": 800},
        "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    }
    if os.path.exists(SESSION_FILE):
        try:
            context_options["storage_state"] = SESSION_FILE
        except Exception:
            pass

    _context = _browser.new_context(**context_options)
    _page = _context.new_page()
    return _page


def open_url(url: str, headless: bool = True) -> Dict[str, Any]:
    """
    Open a web page at the specified URL using Playwright.
    """
    try:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        page = _get_page(headless=headless)
        response = page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(1000)  # Brief grace for client-side rendering

        # Automatically save session cookies
        save_session()

        status_code = response.status if response else 200
        return {
            "success": True,
            "url": page.url,
            "title": page.title(),
            "status_code": status_code,
            "message": f"Successfully navigated to '{page.url}' (Title: '{page.title()}')"
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to open URL '{url}': {str(e)}"}


def analyze_page() -> Dict[str, Any]:
    """
    Analyze the current page structure to extract interactable inputs, textareas, and buttons.
    Allows J.A.R.V.I.S. to understand form layouts on external sites like Fastwork.
    """
    try:
        global _page
        if _page is None or _page.is_closed():
            return {"success": False, "error": "No active web page. Call open_url first."}

        # Extract interactable fields via JavaScript
        fields_intel = _page.evaluate("""() => {
            const inputs = [];
            document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
                if (el.offsetParent !== null) { // Visible check
                    let label = '';
                    if (el.id) {
                        const lbl = document.querySelector(`label[for="${el.id}"]`);
                        if (lbl) label = lbl.innerText.trim();
                    }
                    if (!label && el.closest('label')) {
                        label = el.closest('label').innerText.trim();
                    }
                    inputs.push({
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        name: el.name || '',
                        type: el.type || '',
                        placeholder: el.placeholder || '',
                        label: label,
                        value: el.value || ''
                    });
                }
            });

            const buttons = [];
            document.querySelectorAll('button, input[type="submit"], [role="button"]').forEach(btn => {
                if (btn.offsetParent !== null) {
                    buttons.push({
                        text: btn.innerText ? btn.innerText.trim() : (btn.value || ''),
                        id: btn.id || '',
                        type: btn.type || ''
                    });
                }
            });

            return {
                title: document.title,
                url: window.location.href,
                inputs: inputs.slice(0, 30), // Limit for token efficiency
                buttons: buttons.slice(0, 20)
            };
        }""")

        return {
            "success": True,
            "url": fields_intel["url"],
            "title": fields_intel["title"],
            "form_inputs": fields_intel["inputs"],
            "buttons": fields_intel["buttons"]
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to analyze page: {str(e)}"}


def fill_form_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fill multiple form inputs using smart fuzzy selectors (by name, id, placeholder, or label).
    Example: {'service_title': 'รับเขียนเว็บ', 'price': '3500'}
    """
    try:
        global _page
        if _page is None or _page.is_closed():
            return {"success": False, "error": "No active web page. Call open_url first."}

        filled_results = {}
        for key, val in fields.items():
            str_val = str(val)
            filled = False
            
            # Selector candidates ordered by specificity
            selectors = [
                f'input[name="{key}"]',
                f'textarea[name="{key}"]',
                f'input[id="{key}"]',
                f'textarea[id="{key}"]',
                f'input[placeholder*="{key}" i]',
                f'textarea[placeholder*="{key}" i]',
                f'input[aria-label*="{key}" i]',
                f'textarea[aria-label*="{key}" i]',
                f'label:has-text("{key}") + input',
                f'label:has-text("{key}") input'
            ]

            for sel in selectors:
                try:
                    locator = _page.locator(sel).first
                    if locator.is_visible(timeout=500):
                        locator.fill(str_val)
                        filled = True
                        filled_results[key] = {"selector": sel, "status": "filled", "value": str_val}
                        break
                except Exception:
                    continue

            if not filled:
                filled_results[key] = {"status": "not_found", "message": f"Could not match element for '{key}'"}

        save_session()
        return {
            "success": True,
            "filled_fields": filled_results
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to fill form fields: {str(e)}"}


def click_element(selector_or_text: str) -> Dict[str, Any]:
    """
    Click a button, link, or element specified by CSS selector or text content.
    """
    try:
        global _page
        if _page is None or _page.is_closed():
            return {"success": False, "error": "No active web page. Call open_url first."}

        # Try direct selector first
        clicked = False
        target = selector_or_text.strip()
        
        # Test strategies
        strategies = [
            target,
            f'button:has-text("{target}")',
            f'a:has-text("{target}")',
            f'text="{target}"',
            f'[role="button"]:has-text("{target}")'
        ]

        for s in strategies:
            try:
                loc = _page.locator(s).first
                if loc.is_visible(timeout=1000):
                    loc.click()
                    _page.wait_for_timeout(1000)
                    clicked = True
                    break
            except Exception:
                continue

        if not clicked:
            return {"success": False, "error": f"Element '{selector_or_text}' was not clickable or not found."}

        save_session()
        return {
            "success": True,
            "clicked": selector_or_text,
            "current_url": _page.url,
            "title": _page.title()
        }
    except Exception as e:
        return {"success": False, "error": f"Click failed: {str(e)}"}


def take_screenshot(filename: str = "") -> Dict[str, Any]:
    """
    Take a full or viewport screenshot of the current page and save it into sandbox/output/.
    Returns the file path for user review.
    """
    try:
        global _page
        if _page is None or _page.is_closed():
            return {"success": False, "error": "No active web page to capture."}

        if not filename:
            filename = f"screenshot_{int(time.time())}.png"
        elif not filename.lower().endswith(".png") and not filename.lower().endswith(".jpg"):
            filename += ".png"

        # Ensure filename is safe within output directory
        target_path = os.path.join(sm.OUTPUT_DIR, os.path.basename(filename))
        _page.screenshot(path=target_path, full_page=False)

        rel_path = os.path.relpath(target_path, sm.SANDBOX_ROOT)
        return {
            "success": True,
            "filename": os.path.basename(target_path),
            "sandbox_relative_path": rel_path,
            "size_bytes": os.path.getsize(target_path),
            "message": f"Screenshot saved to 'sandbox/{rel_path}'."
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to take screenshot: {str(e)}"}


def save_session():
    """Save browser cookies and storage state to sandbox/sessions/."""
    try:
        global _context
        if _context is not None:
            _context.storage_state(path=SESSION_FILE)
    except Exception:
        pass


def close_browser() -> Dict[str, Any]:
    """Close the browser context and clean up resources."""
    global _playwright, _browser, _context, _page
    try:
        save_session()
        if _page and not _page.is_closed():
            _page.close()
        if _context:
            _context.close()
        if _browser:
            _browser.close()
        if _playwright:
            _playwright.stop()
        
        _page = None
        _context = None
        _browser = None
        _playwright = None
        return {"success": True, "message": "Browser session closed and cookies preserved."}
    except Exception as e:
        return {"success": False, "error": str(e)}


def is_browser_active() -> bool:
    """Check if a browser page is currently active."""
    global _page
    return _page is not None and not _page.is_closed()


# Alias for convenience
fill_form = fill_form_fields

