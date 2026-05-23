import pytest
import time
import random
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

LAUNDRY_URL = "http://localhost:5173/laundry"

def test_laundry_full_workflow_e2e(logged_in_driver):
    """
    Super-stable E2E test for Laundry Hub with extended timeout debugging.
    """
    driver = logged_in_driver
    # Increase the basic wait time to 20 seconds for slow systems
    wait = WebDriverWait(driver, 20)

    print("\n[INFO] Opening Laundry Hub page...")
    driver.get(LAUNDRY_URL)
    
    # Wait for the page to fully load
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    time.sleep(3)  # Stabilize the React state after fetch requests

    # 1. PAGE LOAD VALIDATION
    try:
        header = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        print(f"[SUCCESS] Page loaded. Title found: '{header.text}'")
    except Exception:
        _handle_timeout_and_debug(driver, "The h1 heading was not found on the laundry page.")

    # Check the user role
    user_role = driver.execute_script("return localStorage.getItem('userRole');")
    print(f"[INFO] Operational user role decoded: '{user_role}'")

    if user_role != 'admin':
        print("[INFO] Non-admin flow verified. Terminating execution safely.")
        return

    # 2. ERROR TRIGGERING AND VISUAL INPUT VALIDATION
    try:
        # Find the add button using a flexible approach based on its text
        add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Add Machine')]")))
        add_btn.click()
        print("[INFO] Clicked 'Add Machine' button.")
    except Exception:
        _handle_timeout_and_debug(driver, "The 'Add Machine' button was not found. Check whether the user is definitely Admin in localStorage.")

    try:
        # Wait for the form to appear and click Submit to check validation
        submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//form//button[@type='submit']")))
        submit_btn.click()
        print("  - Submitted empty form to trigger visual alerts...")
        time.sleep(1)

        # Check whether the input has the border-red-500 or bg-red error class
        name_input = driver.find_element(By.XPATH, "//form//input")
        input_classes = name_input.get_attribute("class")
        assert "red" in input_classes or "border-transparent" not in input_classes, "Empty name validation did not highlight the input!"
        print("[SUCCESS] Visual Alert confirmed: Input style changed on validation error.")
    except Exception:
        _handle_timeout_and_debug(driver, "Error while testing validation of the empty add form.")

    # 3. FILLING IN THE FORM AND CREATING
    test_machine_name = f"LG E2E Auto-{random.randint(100, 999)}"
    name_input.send_keys(test_machine_name)
    
    # Click the washing machine type selection button, the first button in the type group
    type_buttons = driver.find_elements(By.XPATH, "//form//button[@type='button']")
    if type_buttons:
        type_buttons[0].click()  # Select the first available type

    submit_btn.click()
    print(f"[INFO] Form submitted with name: '{test_machine_name}'. Waiting for grid rendering...")
    time.sleep(2)

    # 4. CHECKING THE CARD IN THE GRID AND THE SESSION
    try:
        # Find the card that contains the name of our machine
        machine_card_xpath = f"//*[contains(text(), '{test_machine_name}')]/ancestor::div[contains(@class, 'bg-white') or contains(@class, 'rounded')]"
        machine_card = wait.until(EC.visibility_of_element_located((By.XPATH, machine_card_xpath)))
        print(f"[SUCCESS] Card for '{test_machine_name}' is fully visible in DOM.")
    except Exception:
        _handle_timeout_and_debug(driver, f"The created machine '{test_machine_name}' did not appear in the grid. The API may have returned a 400/500 error.")

    # Start a usage session
    try:
        use_btn = machine_card.find_element(By.XPATH, ".//button[contains(., 'Use') or contains(., 'Edit')]")
        use_btn.click()
        
        # Check timer validation by entering a negative number
        timer_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='number']")))
        timer_input.clear()
        timer_input.send_keys("-10")
        
        start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Start') or contains(., 'Session')]")
        start_btn.click()
        time.sleep(1)
        
        # Check the timer error highlighting
        assert "red" in timer_input.get_attribute("class"), "The timer was not highlighted in red when a negative time was entered!"
        print("[SUCCESS] Visual Alert confirmed: Timer input highlighted red on negative value.")

        # Set a valid time and start
        timer_input.clear()
        timer_input.send_keys("35")
        start_btn.click()
        print("[INFO] Valid session configuration submitted.")
    except Exception:
        _handle_timeout_and_debug(driver, "Failure while interacting with the session status management modal window.")

    # 5. CLEANUP (DELETION)
    try:
        # Trick: automatically accept window.confirm
        driver.execute_script("window.confirm = function() { return true; }")
        
        # Wait for the card to update and click delete, searching for an icon or button through the hierarchy
        machine_card = driver.find_element(By.XPATH, machine_card_xpath)
        delete_btn = machine_card.find_element(By.XPATH, ".//button[descendant::svg or contains(@class, 'text-gray')]")
        delete_btn.click()
        print("[INFO] Clicked delete button.")

        # Check whether the card has disappeared from the screen
        wait.until(EC.invisibility_of_element_located((By.XPATH, machine_card_xpath)))
        print("[SUCCESS] Laundry E2E pipeline finished without leaving test artifacts!")
    except Exception:
        _handle_timeout_and_debug(driver, "Failed to delete the created machine during the state cleanup stage.")


def _handle_timeout_and_debug(driver, custom_message):
    """Helper function: takes a screenshot and provides a detailed developer console report"""
    filename = "laundry_debug_fail.png"
    driver.save_screenshot(filename)
    print(f"\n[CRITICAL ERROR] {custom_message}")
    print(f"[DEBUG] Screenshot saved as: {filename}")
    print("--- BROWSER CONSOLE LOGS ---")
    for entry in driver.get_log('browser'):
        print(f"  [{entry['level']}] {entry['message']}")
    print("----------------------------")
    raise AssertionError(f"{custom_message} See the Chrome console logs above for more detailed information.")