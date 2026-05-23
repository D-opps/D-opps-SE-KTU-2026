import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

FORGOT_PASSWORD_URL = "http://localhost:5173/forgot-password"  # Check your route in React

def test_forgot_password_flow_success(logged_in_driver):
    """
    Test of the successful password reset scenario:
    Entering a valid email -> Checking the switch to the success screen.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    # 1. Open the password recovery page
    driver.get(FORGOT_PASSWORD_URL)
    print("\n[INFO] Navigated to Forgot Password page.")

    # Wait for the form heading to appear
    form_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Forgot Password?')]")))
    assert form_title.is_displayed(), "The 'Forgot Password' page did not load"

    # 2. Find the input and enter a test email
    email_input = driver.find_element(By.XPATH, "//input[@type='email']")
    test_email = "polina.sevastianova9@gmail.com"  # Email that definitely exists in your Django database/fixtures
    email_input.send_keys(test_email)
    print(f"  - Typed email: '{test_email}'")

    # 3. Click the email submission button
    submit_btn = driver.find_element(By.XPATH, "//form//button")
    submit_btn.click()
    print("  - Submit button clicked. Waiting for API response...")

    # 4. Check successful conditional rendering (Check Your Email screen)
    success_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Check Your Email')]")))
    assert success_title.is_displayed(), "The successful submission screen was not displayed"

    # Check whether our email is displayed in the success text
    success_container = driver.find_element(By.XPATH, "//div[contains(@class, 'bg-white')]")
    assert test_email in success_container.text, "The entered email is not displayed on the success screen"
    print("[SUCCESS] Forgot password success flow verified completely!")


def test_forgot_password_flow_error(logged_in_driver):
    """
    Test of the negative scenario:
    Entering a non-existent email -> Checking the rendering of the Django error block.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    driver.get(FORGOT_PASSWORD_URL)
    print("\n[INFO] Testing Password Reset validation error...")

    # Enter an email that is definitely not in the database
    email_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='email']")))
    fake_email = f"non_existent_user_{int(time.time())}@university.edu"
    email_input.send_keys(fake_email)

    submit_btn = driver.find_element(By.XPATH, "//form//button")
    submit_btn.click()
    print("  - Clicked submit with non-existent email.")

    # Wait for the error block to appear (error state in the React component)
    error_box = wait.until(EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'bg-red-50')]")))
    print(f"  - Error detected in UI: '{error_box.text}'")

    # Check that the form has not disappeared and that we remain on the same page
    assert driver.find_element(By.XPATH, "//h2[contains(text(), 'Forgot Password?')]").is_displayed()
    print("[SUCCESS] Error handling and Django validation rendering verified successfully!")