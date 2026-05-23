import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

REGISTER_URL = "http://localhost:5173/register"

@pytest.fixture(scope="function")
def clean_driver():
    """Creates a clean isolated browser specifically for registration"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")  # Can be removed if you want to see the browser
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


def test_registration_flow_and_role_switching(clean_driver):
    driver = clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Setting up a mock for successful account creation...")
    mock_register_js = """
    (function() {
        if (!window.XHR_REGISTER_MOCK) {
            window.XHR_REGISTER_MOCK = true;
            const origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (url && url.includes('/api/register/')) {
                    this.addEventListener('load', function() {
                        Object.defineProperty(this, 'status', { writable: true, value: 201 });
                        Object.defineProperty(this, 'responseText', { writable: true, value: '{"status": "created"}' });
                    });
                }
                return origOpen.apply(this, arguments);
            };
        }
    })();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": mock_register_js
    })

    print("[STEP 2] Navigating to the registration page...")
    driver.get(REGISTER_URL)
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")

    print("[STEP 3] Filling in the Student registration form...")
    name_input = wait.until(EC.visibility_of_element_located((By.NAME, "fullName")))
    name_input.send_keys("Остап Студент")

    email_input = driver.find_element(By.NAME, "email")
    email_input.send_keys("ostap@university.edu")

    dorm_select = Select(driver.find_element(By.NAME, "dormitory"))
    dorm_select.select_by_value("5")

    room_input = driver.find_element(By.NAME, "roomNumber")
    room_input.send_keys("502B")

    print("[STEP 4] Entering the password and checking the interactive security requirements UI...")
    password_input = driver.find_element(By.NAME, "password")
    confirm_password_input = driver.find_element(By.NAME, "confirmPassword")

    password_input.send_keys("SecurePass123!")
    confirm_password_input.send_keys("SecurePass123!")

    requirement_badge = wait.until(EC.visibility_of_element_located((By.XPATH, "//span[contains(text(), '8+ characters')]")))
    assert "text-green-600" in requirement_badge.find_element(By.XPATH, "..").get_attribute("class")
    print("  -> Password validation UI worked correctly.")

    print("[STEP 5] Submitting the form and checking the redirect after successful registration...")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()

    wait.until(EC.url_contains("/login"))
    print("  -> Redirect to the login page was successful!")


def test_registration_conditional_fields_for_admin(clean_driver):
    driver = clean_driver
    wait = WebDriverWait(driver, 10)
    
    print("\n[STEP 1] Navigating to the registration page for role testing...")
    driver.get(REGISTER_URL)
    
    assert wait.until(EC.visibility_of_element_located((By.NAME, "roomNumber"))).is_displayed()

    print("[STEP 2] Switching the role to Admin and checking the conditional layout...")
    admin_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Admin']]")))
    admin_role_btn.click()

    room_field_removed = wait.until(EC.invisibility_of_element_located((By.NAME, "roomNumber")))
    assert room_field_removed, "The Room Number field did not disappear after selecting the Admin role!"
    
    print("  -> The room field was successfully hidden for the Admin role.")