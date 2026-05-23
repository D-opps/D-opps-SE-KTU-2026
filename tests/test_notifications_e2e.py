import pytest
import time
self_timeout = 10
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

NOTIFICATIONS_URL = "http://localhost:5173/notifications"

def test_notifications_page_lifecycle(logged_in_driver):
    driver = logged_in_driver
    wait = WebDriverWait(driver, self_timeout)

    print("\n[STEP 1] Setting up a universal network mock (Fetch + XHR/Axios) through CDP...")
    
    mock_network_js = """
    (function() {
        const mockData = [
            {
                "id": 991,
                "notification_type": "message",
                "title": "E2E Chat Alert",
                "description": "Test message from Selenium",
                "target_id": "chat_xyz",
                "is_read": false,
                "created_at": new Date().toISOString()
            },
            {
                "id": 992,
                "notification_type": "event",
                "title": "E2E Event Workshop",
                "description": "Read event",
                "target_id": null,
                "is_read": true,
                "created_at": new Date().toISOString()
            }
        ];

        // 1. Mock Fetch
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            if (args[0] && args[0].includes('/api/notifications/')) {
                console.log('--- MOCKING FETCH NOTIFICATIONS ---');
                return new Response(JSON.stringify(mockData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                });
            }
            return origFetch(...args);
        };

        // 2. Mock XMLHttpRequest (for Axios)
        const open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/notifications/')) {
                this.addEventListener('readystatechange', function() {
                    if (this.readyState === 4) {
                        console.log('--- MOCKING XHR/AXIOS NOTIFICATIONS ---');
                        Object.defineProperty(this, 'status', { writable: true, value: 200 });
                        Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify(mockData) });
                        Object.defineProperty(this, 'response', { writable: true, value: mockData });
                    }
                });
            }
            return open.apply(this, arguments);
        };
    })();
    """
    
    # Register the script in the Chromium engine so that it is executed ALWAYS
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": mock_network_js
    })

    print("[STEP 2] Navigating to the page and preparing localStorage...")
    driver.get(NOTIFICATIONS_URL)
    
    # Ensure that the token is present so Axios does not fail before making the request
    driver.execute_script("localStorage.setItem('accessToken', 'mock-e2e-token-123');")
    
    # Reload the page so React starts with the token and the activated network mock
    driver.refresh()
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    time.sleep(2)

    print("[STEP 3] Checking notification card display...")
    unread_card_xpath = "//h3[contains(text(), 'E2E Chat Alert')]/ancestor::div[contains(@class, 'cursor-pointer')]"
    read_card_xpath = "//h3[contains(text(), 'E2E Event Workshop')]/ancestor::div[contains(@class, 'cursor-pointer')]"
    
    try:
        unread_card = wait.until(EC.visibility_of_element_located((By.XPATH, unread_card_xpath)))
        assert "Test message from Selenium" in unread_card.text
        print("  -> Notifications were successfully rendered in the UI!")
    except Exception as e:
        # Take a screenshot to see the actual state of the screen, possibly just a blank screen due to a React error
        driver.save_screenshot("notifications_error_fallback.png")
        print("[ERR] Card not found. Screenshot saved as 'notifications_error_fallback.png'")
        raise e

    print("[STEP 4] Testing actual status filtering...")
    try:
        unread_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Unread')]")))
        unread_btn.click()
        
        wait.until(EC.invisibility_of_element_located((By.XPATH, read_card_xpath)))
        print("  -> The read card successfully disappeared after filtering.")
        
        assert driver.find_element(By.XPATH, unread_card_xpath).is_displayed()
        print("  -> Status filtering worked correctly at the React State level!")
        
    except Exception as e:
        pytest.fail(f"Error during filtering: {e}")

    print("\n[SUCCESS] E2E notifications test completed successfully!")