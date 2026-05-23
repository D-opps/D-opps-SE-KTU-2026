import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Check whether the route in your App.tsx is exactly /report/ or perhaps /reports/
REPORT_URL = "http://localhost:5173/report/product/42"

@pytest.fixture(scope="function")
def authorized_clean_driver():
    """Creates a clean browser and safely injects the token before the React components start"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    
    # STEP A: Open the page (it may initially think that we are not authorized)
    driver.get(REPORT_URL)
    
    # STEP B: Quickly write the token to localStorage for this domain
    driver.execute_script("localStorage.setItem('accessToken', 'mock-report-user-token-777');")
    
    # STEP C: Immediately reload the page. Now React loads while seeing the token from the very first millisecond
    driver.execute_script("window.location.reload();")
    
    yield driver
    driver.quit()


def test_submit_complaint_flow(authorized_clean_driver):
    driver = authorized_clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Dynamic mock injection to intercept the Axios POST request to /api/reports/...")
    # Set the interceptor directly in the current window session
    mock_report_api_js = """
    (function() {
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/reports/')) {
                this.addEventListener('load', function() {
                    Object.defineProperty(this, 'status', { writable: true, value: 201 });
                    Object.defineProperty(this, 'responseText', { writable: true, value: '{"id": 1, "success": true}' });
                    Object.defineProperty(this, 'response', { writable: true, value: {"id": 1, "success": true} });
                });
            }
            return origOpen.apply(this, arguments);
        };
    })();
    """
    driver.execute_script(mock_report_api_js)

    print("[STEP 2] Waiting for the DOM to fully load and validating the page...")
    try:
        # Wait for the main form heading "Complain?"
        header_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Complain?')]")))
        print("  -> The complaint page loaded successfully!")
    except Exception as e:
        # If it fails again, we will see exactly where the browser was located (possibly on /login)
        print(f"[DEBUG INFO] Current browser URL when the test failed: {driver.current_url}")
        driver.save_screenshot("report_timeout_debug.png")
        raise e

    print("[STEP 3] Selecting the complaint reason (Fraud)...")
    # Find the block with the text "Fraud"
    fraud_option = wait.until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Fraud')]/ancestor::div[contains(@class, 'cursor-pointer')]")))
    
    # Click through JavaScript to avoid any ElementClickIntercepted errors
    driver.execute_script("arguments[0].click();", fraud_option)
    print("  -> The 'Fraud' reason has been selected.")

    print("[STEP 4] Filling in the details text field...")
    textarea = driver.find_element(By.TAG_NAME, "textarea")
    textarea.send_keys("Automated test: complaint about a fake product.")

    print("[STEP 5] Submitting the complaint using a JS click...")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    
    # Click submit
    driver.execute_script("arguments[0].click();", submit_btn)

    # Wait for the animation or redirect to complete (the button should disappear from the DOM)
    wait.until(EC.staleness_of(submit_btn))
    print("  -> Test completed successfully! The complaint has been submitted.")


def test_cancel_complaint_navigation(authorized_clean_driver):
    driver = authorized_clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Checking the complaint cancellation button...")
    try:
        cancel_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'I changed my mind')]")))
        driver.execute_script("arguments[0].click();", cancel_btn)
        wait.until(EC.staleness_of(cancel_btn))
        print("  -> Returning back works correctly.")
    except Exception as e:
        print(f"[DEBUG INFO] Current URL when the test failed: {driver.current_url}")
        raise e