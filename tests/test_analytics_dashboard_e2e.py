import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ANALYTICS_URL = "http://localhost:5173/admin/analytics"

def test_analytics_dashboard_loading_and_cards(logged_in_driver):
    """
    E2E test: Uses an existing admin session, navigates to the platform
    analytics page, and validates the presence of metric cards using Explicit Waits.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 15)

    driver.get(ANALYTICS_URL)
    print(f"\n[INFO] Navigated directly to Analytics page: {ANALYTICS_URL}")

    try:
        page_title = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Platform Growth') or contains(text(), 'Statistics')]"))
        )
        print("[INFO] Analytics page verified successfully!")
    except Exception:
        driver.save_screenshot("analytics_dashboard_view_error.png")
        raise AssertionError(
            f"Can't find analytics header. Current URL: {driver.current_url}. "
            "Check if the route is correctly specified in the ANALYTICS_URL constant."
        )

    metrics_to_check = [
        "Residents",
        "Chat",
        "Marketplace",
        "Laundry",
        "Reports"
    ]

    print("[INFO] Validating analytical cards with explicit waits...")
    for metric in metrics_to_check:
        try:
            xpath_selector = f"//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{metric.lower()}')]"
            
            card_title = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_selector)))
            print(f"  - Verified card containing: '{metric}'")
        except Exception:
            driver.save_screenshot(f"missing_card_{metric}.png")
            raise AssertionError(f"Error: Missing or unloaded card containing '{metric}' on the dashboard.")

    print("[SUCCESS] All core analytics dashboard cards verified successfully!")