import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

CHAT_URL = "http://localhost:5173/chat"

def test_chat_workflow_and_features(logged_in_driver):
    """
    E2E тест для месенджера.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    driver.get(CHAT_URL)
    print("\n[INFO] Navigated to Chat page.")

    # Перевіряємо, чи завантажився інтерфейс сайдбару
    try:
        wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[contains(text(), 'MESSAGES')]")))
        print("[INFO] Chat sidebar interface loaded successfully.")
    except Exception:
        driver.save_screenshot("chat_page_load_error.png")
        raise AssertionError("Не вдалося завантажити сторінку чатів.")

    # Перевірка кнопок спец-чатів
    global_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Global')]")))
    dorm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Dorm')]")

    # ТЕСТ ПОШУКУ ЗА EMAIL
# ТЕСТ ПОШУКУ ЗА EMAIL всередині test_chat_workflow_and_features
    print("[INFO] Testing user search bar...")
    search_email = "Polina@gmail.com"
    
    try:
        # Знаходимо input, який знаходиться в одному блоці з іконкою пошуку
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
    # ВІДПРАВКА ПОВІДОМЛЕННЯ
    print("[INFO] Testing message sending...")
    global_btn.click() # Відкриваємо глобальний чат
    time.sleep(1.5)

    try:
        # Знаходимо єдиний input у футері форми чату
        message_input = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//footer//form//input"))
        )
        
        # Кнопка відправки всередині тієї ж форми footerform
        send_button = driver.find_element(By.XPATH, "//footer//form//button")
        
        test_message = f"Automated E2E Test Message - {time.strftime('%H:%M:%S')}"
        message_input.send_keys(test_message)
        
        # Клік
        send_button.click()
        print("  - Message sent. Validating optimistic input clear...")
        
        # Перевірка оптимістичного інтерфейсу
        assert message_input.get_attribute("value") == "", "React інпут не очистився оптимістично!"
        print("  - Optimistic UI success: input cleared instantly.")

        # Перевіряємо появу повідомлення в історії чату
        sent_msg_bubble = wait.until(
            EC.presence_of_element_located((By.XPATH, f"//p[contains(text(), '{test_message}')]"))
        )
        assert sent_msg_bubble.is_displayed(), "Відправлене повідомлення не з'явилося на екрані."
        print(f"  - Verified: Message text found in chat history.")

    except Exception as e:
        driver.save_screenshot("chat_message_sending_error.png")
        raise AssertionError(f"Помилка під час спроби відправити повідомлення в чат: {e}")

    print("\n[SUCCESS] Chat System E2E Test Passed Successfully!")