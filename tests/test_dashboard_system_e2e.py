import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from conftest import ADMIN_EMAIL, ADMIN_PASSWORD, BASE_URL

def test_dashboard_and_admin_analytics_flow(logged_in_driver):
    
    driver = logged_in_driver
    wait = WebDriverWait(driver, 20)  

    driver.get(BASE_URL)
    print("\n[INFO] Ensuring user is authorized...")
    
    try:
        email_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='email' or @type='text']")))
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        submit_button = driver.find_element(By.XPATH, "//form//button | //button[@type='submit']")
        
        email_input.clear()
        email_input.send_keys(ADMIN_EMAIL)
        password_input.clear()
        password_input.send_keys(ADMIN_PASSWORD)
        submit_button.click()
        print("[INFO] Clicked submit. Waiting for React to process auth and fetch data...")
    except Exception:
        print("[INFO] Already logged in or on dashboard.")

    try:
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "animate-spin")))
        print("  - Spinner detected. Waiting for Django API metrics response...")
        wait.until_not(EC.presence_of_element_located((By.CLASS_NAME, "animate-spin")))
        print("  - Spinner disappeared. UI fully rendered.")
    except Exception:
        print("  - Spinner was too fast or already gone. Checking page content...")

    try:
        welcome_heading = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1"))
        )
        print(f"[INFO] Header banner successfully loaded! Text: '{welcome_heading.text}'")
        assert "Hey" in welcome_heading.text or "Welcome" in driver.page_source, "Welcome text not found"
    except Exception as e:
        driver.save_screenshot("dashboard_banner_error.png")
        raise AssertionError(f"The main banner did not load. Current URL: {driver.current_url}. Error: {e}")

    print("[INFO] Validating Admin Analytics block...")
    try:
        analytics_title = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h2[contains(., 'Analytics') or contains(., 'Analytics')]"))
        )
        assert analytics_title.is_displayed(), "The analytics section is not displayed"

        period_select = wait.until(
            EC.element_to_be_clickable((By.TAG_NAME, "select"))
        )
        period_select.click()
        option_30 = driver.find_element(By.XPATH, "//option[@value='30']")
        option_30.click()
        
        time.sleep(1.5)  
        
        total_users_card = driver.find_element(By.XPATH, "//*[contains(text(), 'Users') or contains(text(), 'Total')]")
        assert total_users_card.is_displayed(), "The metric cards were not rendered"
        print("  - Analytics dropdown and cards validated successfully.")
    except Exception as e:
        driver.save_screenshot("dashboard_analytics_error.png")
        raise AssertionError(f"Error while testing the admin metrics block: {e}")

    print("[INFO] Checking Quick Action Cards navigation paths...")
    try:
        laundry_card = driver.find_element(By.XPATH, "//a[contains(@href, '/laundry')]")
        chat_card = driver.find_element(By.XPATH, "//a[contains(@href, '/chat')]")
        
        assert laundry_card.is_displayed(), "The Laundry Room card is missing"
        assert chat_card.is_displayed(), "The Community Chat card is missing"
        print("  - Quick action links mapped correctly to target routes.")
    except Exception as e:
        raise AssertionError(f"Error while checking the navigation cards: {e}")

    print("[INFO] Checking Community Buzz block...")
    try:
        buzz_section = driver.find_element(By.XPATH, "//h2[contains(text(), 'Buzz') or contains(text(), 'Community')]")
        assert buzz_section.is_displayed(), "The notification feed section is missing"
        print("  - Feed container validated.")
    except Exception as e:
        raise AssertionError(f"Error while checking the Community Buzz feed: {e}")

    print("\n[SUCCESS] Dashboard & Admin Analytics E2E Test Passed!")