import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHAT_URL = "http://localhost:5173/chat"

def test_chat_workflow_and_features(logged_in_driver):
    """
    E2E test for the messenger.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    driver.get(CHAT_URL)
    print("\n[INFO] Navigated to Chat page.")

    # Check whether the sidebar interface has loaded
    try:
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'MESSAGES')]")))
        print("[INFO] Chat sidebar interface loaded successfully.")
    except Exception:
        driver.save_screenshot("chat_page_load_error.png")
        raise AssertionError("Failed to load the chats page.")

    # Check the special chat buttons
    global_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Global')]")))
    dorm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Dorm')]")

    # EMAIL SEARCH TEST
# EMAIL SEARCH TEST inside test_chat_workflow_and_features
    print("[INFO] Testing user search bar...")
    search_email = "Polina@gmail.com"
    
    try:
        # Find the input located in the same block as the search icon
        search_input = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//aside//input[contains(@placeholder, 'Пошук') or @type='text']"))
        )
        search_input.clear()
        search_input.send_keys(search_email)
        search_input.send_keys(Keys.ENTER)
        print(f"  - Searched for user email: {search_email}")
        time.sleep(1)
    except Exception as e:
        driver.save_screenshot("chat_search_error.png")
        raise AssertionError(f"Cannot find or interact with email search field. Error: {e}")
    # SENDING A MESSAGE
    print("[INFO] Testing message sending...")
    global_btn.click() # Open the global chat
    time.sleep(1.5)

    try:
        # Find the only input in the chat form footer
        message_input = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//footer//form//input"))
        )
        
        # Send button inside the same footer form
        send_button = driver.find_element(By.XPATH, "//footer//form//button")
        
        test_message = f"Automated E2E Test Message - {time.strftime('%H:%M:%S')}"
        message_input.send_keys(test_message)
        
        # Click
        send_button.click()
        print("  - Message sent. Validating optimistic input clear...")
        
        # Check the optimistic interface
        assert message_input.get_attribute("value") == "", "React input was not cleared optimistically!"
        print("  - Optimistic UI success: input cleared instantly.")

        # Check that the message appears in the chat history
        sent_msg_bubble = wait.until(
            EC.presence_of_element_located((By.XPATH, f"//p[contains(text(), '{test_message}')]"))
        )
        assert sent_msg_bubble.is_displayed(), "The sent message did not appear on the screen."
        print(f"  - Verified: Message text found in chat history.")

    except Exception as e:
        driver.save_screenshot("chat_message_sending_error.png")
        raise AssertionError(f"Error while attempting to send a message in the chat: {e}")

    print("\n[SUCCESS] Chat System E2E Test Passed Successfully!")