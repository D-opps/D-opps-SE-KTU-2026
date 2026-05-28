import pytest
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

RESET_URL = "http://localhost:5173/reset-password/dynamic-token-xyz"

@pytest.fixture(scope="function")
def clean_driver():
    """Initializes an isolated browser without additional sessions"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


def test_reset_password_validation_and_success(clean_driver):
    driver = clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Preparing a persistent mock for the Django API through sessionStorage...")
    mock_api_script = """
    (function() {
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/password_reset/confirm/')) {
                this.addEventListener('load', function() {
                    Object.defineProperty(this, 'status', { writable: true, value: 200 });
                    Object.defineProperty(this, 'responseText', { writable: true, value: '{"status": "OK"}' });
                });
            }
            return origOpen.apply(this, arguments);
        };
    })();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_api_script})

    print("[STEP 2] Opening the password reset page...")
    driver.get(RESET_URL)

    wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[text()='DormLife']")))
    
    password_input = driver.find_element(By.XPATH, "//label[text()='New Password']/following::input[1]")
    confirm_input = driver.find_element(By.XPATH, "//label[text()='Confirm Password']/following::input[1]")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")

    print("[STEP 3] Checking password strength validation using a password that is too weak...")
    password_input.send_keys("weakpass")
    confirm_input.send_keys("weakpass")
    
    driver.execute_script("arguments[0].click();", submit_btn)

    error_box = wait.until(EC.visibility_of_element_located((By.XPATH, "//p[contains(text(), 'Password does not meet all requirements')]")))
    assert error_box.is_displayed(), "The screen did not block submission of a weak password!"
    print("  -> The interface successfully blocked the weak password.")

    print("[STEP 4] Checking validation for mismatched passwords...")
    password_input.clear()
    confirm_input.clear()
    
    password_input.send_keys("SecurePass123!")
    confirm_input.send_keys("DifferentPass123!")
    
    driver.execute_script("arguments[0].click();", submit_btn)
    
    wait.until(EC.text_to_be_present_in_element((By.XPATH, "//div[contains(@class, 'bg-red-50')]//p"), "Passwords do not match."))
    print("  -> The interface successfully detected the password mismatch.")

    print("[STEP 5] Entering valid data and successfully resetting the password...")
    confirm_input.clear()
    confirm_input.send_keys("SecurePass123!") 
    
    driver.execute_script("arguments[0].click();", submit_btn)

    print("[STEP 6] Validating the Success screen...")
    wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[text()='Success!']")))
    
    success_text = driver.find_element(By.XPATH, "//p[contains(text(), 'Your password has been updated')]")
    assert success_text.is_displayed()
    
    login_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Go to Login Now')]")
    assert login_link.is_displayed()
    print(" Test completed successfully! The password has been updated and the Success screen is displayed.")