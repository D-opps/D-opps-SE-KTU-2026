import pytest
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

DASHBOARD_URL = "http://localhost:5173/admin/reports"

@pytest.fixture(scope="function")
def admin_authorized_driver():
    """Initializes the browser, enables console log collection, and adds authorization"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    # Enable browser log collection for debugging
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    
    driver = webdriver.Chrome(options=options)
    
    # Authorize through the base URL
    driver.get("http://localhost:5173/")
    driver.execute_script("localStorage.setItem('accessToken', 'mock-admin-secure-token-111');")
    
    yield driver
    driver.quit()


def test_report_dashboard_lifecycle(admin_authorized_driver):
    driver = admin_authorized_driver
    wait = WebDriverWait(driver, 10)

    initial_reports = [
        {
            "id": 501,
            "reporter_name": "Ivan Manipulator",
            "reporter_email": "ivan@stu.edu",
            "content_details": "Contraband hookah",
            "reason": "fraud",
            "description": "Sells prohibited substances in the dormitory!",
            "status": "pending"
        }
    ]

    print("\n[STEP 1] Registering a persistent interceptor through CDP before the page loads...")
    # This script will be executed FIRST by Chrome, even before parsing your React/Vite code
    mock_api_script = f"""
    (function() {{
        // Write mocks to sessionStorage if they are not there yet
        if (!sessionStorage.getItem('mock_reports')) {{
            sessionStorage.setItem('mock_reports', JSON.stringify({json.dumps(initial_reports)}));
            sessionStorage.setItem('action_called', 'false');
        }}

        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {{
            if (url && url.includes('/api/reports/')) {{
                if (method === 'GET') {{
                    this.addEventListener('load', function() {{
                        const savedData = sessionStorage.getItem('mock_reports') || '[]';
                        Object.defineProperty(this, 'status', {{ writable: true, value: 200 }});
                        Object.defineProperty(this, 'responseText', {{ writable: true, value: savedData }});
                    }});
                }}
                if (method === 'POST' && url.includes('/perform_action/')) {{
                    this.addEventListener('load', function() {{
                        sessionStorage.setItem('action_called', 'true');
                        const currentData = JSON.parse(sessionStorage.getItem('mock_reports') || '[]');
                        if (currentData.length > 0) {{
                            currentData[0].status = 'resolved';
                            sessionStorage.setItem('mock_reports', JSON.stringify(currentData));
                        }}
                        Object.defineProperty(this, 'status', {{ writable: true, value: 200 }});
                        Object.defineProperty(this, 'responseText', {{ writable: true, value: '{{"success": true}}' }});
                    }});
                }}
            }}
            return origOpen.apply(this, arguments);
        }};
    }})();
    """
    
    # Inject the mock at the Chrome engine level
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_api_script})

    print("[STEP 2] Direct navigation to the Dashboard page...")
    driver.get(DASHBOARD_URL)

    print("[STEP 3] Waiting for interface elements with full debugging in case of an error...")
    try:
        # Wait for the main page heading
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(., 'Reports Management')]")))
    except Exception as e:
        # ======= DEEP ENVIRONMENT DIAGNOSTICS BLOCK =======
        print("\n THE BROWSER IS STUCK! COLLECTING DIAGNOSTIC DATA:")
        print(f"Current URL in Chrome: {driver.current_url}")
        
        # 1. Save a screenshot of the screen to see whether it is a blank page or a 404 error
        driver.save_screenshot("dashboard_fatal_debug.png")
        print(" Screenshot saved to file: dashboard_fatal_debug.png")
        
        # 2. Output errors from the browser console, for example, a chunk failed to load or a JS error occurred
        print("\n BROWSER CONSOLE LOGS (JS ERRORS):")
        for log in driver.get_log('browser'):
            print(f"   [{log['level']}] {log['message']}")
            
        # 3. Output the HTML code currently visible to Selenium
        print("\n PAGE HTML STRUCTURE (FIRST 500 CHARACTERS):")
        print(driver.page_source[:500])
        raise e

    print("[STEP 4] Checking the Total counter...")
    total_counter_xpath = "//p[text()='Total']/following-sibling::p"
    wait.until(EC.text_to_be_present_in_element((By.XPATH, total_counter_xpath), "1"))
    
    print("[STEP 5] Clicking the remove content button...")
    remove_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@title='Remove content']")))
    driver.execute_script("arguments[0].click();", remove_btn)

    print("[STEP 6] Waiting for the status update...")
    wait.until(EC.visibility_of_element_located((By.XPATH, "//div[contains(., 'Handled')]")))
    print("Test completed successfully!")