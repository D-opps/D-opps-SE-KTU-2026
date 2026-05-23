import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

EVENTS_URL = "http://localhost:5173/events"

def test_events_crud_and_rsvp_flow(logged_in_driver):
    """
    Comprehensive E2E test of the Events system with direct card text verification.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 15)

    # 1. Navigate to the events page
    driver.get(EVENTS_URL)
    print("\n[INFO] Navigated to Events page.")

    # Wait for the initial loader to disappear
    try:
        wait.until_not(EC.text_to_be_present_in_element((By.TAG_NAME, "body"), "Loading..."))
    except Exception:
        pass

    page_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'Dorm Events')]")))
    assert page_title.is_displayed(), "The events page did not load"

    # ==========================================
    # STEP 2: OPENING THE MODAL AND CREATING AN EVENT
    # ==========================================
    print("[INFO] Creating a new community event...")
    
    create_btn = driver.find_element(By.XPATH, "//button[contains(., 'Create')]")
    create_btn.click()

    # Wait for the modal
    wait.until(EC.visibility_of_element_located((By.XPATH, "//form//h2[contains(text(), 'Create Event')]")))

    event_title = f"E2E Board Game Night {int(time.time())}"
    event_desc = "Testing event description text via Selenium Automation."
    event_loc = "Dormitory Lounge, Room 404"

    # Fill in the basic text fields
    driver.find_element(By.XPATH, "//form//input[@placeholder='Title']").send_keys(event_title)
    driver.find_element(By.XPATH, "//form//textarea[@placeholder='Description (optional)']").send_keys(event_desc)
    driver.find_element(By.XPATH, "//form//input[@placeholder='Location']").send_keys(event_loc)

    # Simulate entering dates
    print("  - Sending keyboard sequences to datetime-local inputs...")
    date_inputs = driver.find_elements(By.XPATH, "//form//input[@type='datetime-local']")
    
    date_inputs[0].click()
    date_inputs[0].send_keys("25")
    date_inputs[0].send_keys("12")
    date_inputs[0].send_keys("2026")
    date_inputs[0].send_keys(Keys.TAB)
    date_inputs[0].send_keys("18")
    date_inputs[0].send_keys("00")

    date_inputs[1].click()
    date_inputs[1].send_keys("25")
    date_inputs[1].send_keys("12")
    date_inputs[1].send_keys("2026")
    date_inputs[1].send_keys(Keys.TAB)
    date_inputs[1].send_keys("22")
    date_inputs[1].send_keys("00")

    # Submit the form
    submit_btn = driver.find_element(By.XPATH, "//form//button[@type='submit']")
    submit_btn.click()
    print("  - Form submitted. Waiting for event card to appear in grid...")

    # ==========================================
    # STEP 3: CHECKING THE PUBLICATION OF THE EVENT CARD
    # ==========================================
    wait.until(EC.visibility_of_element_located((By.XPATH, f"//h2[contains(text(), '{event_title}')]")))
    print(f"[SUCCESS] Event '{event_title}' successfully created and rendered!")

    # ==========================================
    # STEP 4: TESTING THE RSVP MECHANISM (GO/LEAVE)
    # ==========================================
    print("[INFO] Testing RSVP interaction...")
    
    # Find the parent card
    event_card_xpath = f"//h2[contains(text(), '{event_title}')]/ancestor::div[contains(@class, 'bg-white') or contains(@class, 'rounded')][1]"
    event_card = wait.until(EC.visibility_of_element_located((By.XPATH, event_card_xpath)))

    # Check the initial state directly from the text of the entire card
    assert "0 going" in event_card.text, "The initial counter is not equal to 0"
    print("  - Initial status verified: '0 going'")

    # Click the RSVP button inside this card
    rsvp_button = event_card.find_element(By.XPATH, ".//button[contains(text(), 'Go/Leave')]")
    rsvp_button.click()
    print("  - Clicked Go/Leave button.")

    # Wait until "1 going" appears in the card text
    wait.until(lambda d: "1 going" in event_card.text)
    print("  - Updated status verified: '1 going'")

    # ==========================================
    # STEP 5: DELETING THE EVENT (CLEANUP)
    # ==========================================
    print("[INFO] Cleaning up: deleting the created test event...")
    
    # Reliably find the delete button inside the card, either the last one or the one containing an svg/icon
    # If the icon is not found by the svg tag, click the second button in the actions block
    try:
        delete_button = event_card.find_element(By.XPATH, ".//button[./*[local-name()='svg']]")
    except Exception:
        delete_button = event_card.find_elements(By.XPATH, ".//button")[-1] # Last button in the card
        
    delete_button.click()

    # Check that the card has completely disappeared from the DOM
    wait.until(
        EC.invisibility_of_element_located((By.XPATH, f"//h2[contains(text(), '{event_title}')]"))
    )
    print("[SUCCESS] Event deleted. State cleaned up successfully.")