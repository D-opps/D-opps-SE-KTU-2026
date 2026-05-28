import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from conftest import ADMIN_EMAIL, ADMIN_PASSWORD, BASE_URL

def test_admin_login_and_dashboard_welcome():
    """Test for verifying authorization and the welcome banner with smart waiting."""
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)
    
    driver.get(BASE_URL)
    print("\n[INFO] Login page opened.")
    
    try:
        email_input = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//input[@type='email' or @type='text']"))
        )
        
        password_input = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//input[@type='password']"))
        )
        
        submit_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//form//button | //button[@type='submit']"))
        )
        print("[INFO] All login elements successfully located via explicit waits!")
        
    except Exception as e:
        driver.save_screenshot("login_elements_wait_error.png")
        driver.quit()
        raise AssertionError(f"Failed to find the login form elements. Screenshot saved. Error: {e}")
    
    email_input.clear()
    email_input.send_keys(ADMIN_EMAIL)
    
    password_input.clear()
    password_input.send_keys(ADMIN_PASSWORD)
    
    submit_button.click()
    print("[INFO] Login form submitted.")
    
    wait.until(EC.url_changes(BASE_URL))
    time.sleep(1) 
    
    welcome_heading = wait.until(
        EC.visibility_of_element_located((By.TAG_NAME, "h1"))
    )
    
    print(f"[INFO] Welcome page loaded. Heading text: '{welcome_heading.text}'")
    print("[SUCCESS] Login E2E Test Passed!")
    driver.quit()