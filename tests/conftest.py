import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Universal settings for the entire project
BASE_URL = "http://localhost:5173/login"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Qwerty_21"

@pytest.fixture(scope="function")
def logged_in_driver():
    """
    Magic fixture: launches the browser, performs a guaranteed admin login
    using flexible selectors that have already worked, and returns
    a ready-to-use window.
    """
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    
    wait = WebDriverWait(driver, 10)
    
    # Login scenario that has already proven to work
    driver.get(BASE_URL)
    
    try:
        # Find the email field using a flexible XPATH
        email_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='email' or @type='text' or contains(@placeholder, 'Email') or contains(@placeholder, 'email')]"))
        )
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@placeholder, 'Password') or contains(@placeholder, 'пароль')]")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Login') or contains(text(), 'Sign In') or contains(text(), 'Увійти')]")
        
        # Fill in the form with the new credentials
        email_input.send_keys(ADMIN_EMAIL)
        password_input.send_keys(ADMIN_PASSWORD)
        submit_button.click()
        
        # Make sure that the redirect has occurred
        wait.until(EC.url_changes(BASE_URL))
        time.sleep(1) # Allow the token to be stored in the system
        
    except Exception as e:
        driver.save_screenshot("global_login_error.png")
        driver.quit()
        raise AssertionError(f"The global fixture was unable to authorize the admin. Error: {e}")
        
    yield driver
    driver.quit()