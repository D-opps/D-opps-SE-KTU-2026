import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from conftest import ADMIN_EMAIL, ADMIN_PASSWORD, BASE_URL

def test_admin_login_and_dashboard_welcome():
    """Тест перевірки авторизації та вітального банера з розумним очікуванням."""
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)
    
    driver.get(BASE_URL)
    print("\n[INFO] Login page opened.")
    
    try:
        # 1. Чекаємо на поле Email
        email_input = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//input[@type='email' or @type='text']"))
        )
        
        # 2. Чекаємо на поле Пароль
        password_input = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//input[@type='password']"))
        )
        
        # 3. Чекаємо на кнопку (шукаємо type='submit' АБО будь-яку кнопку всередині форми)
        submit_button = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//form//button | //button[@type='submit']"))
        )
        print("[INFO] All login elements successfully located via explicit waits!")
        
    except Exception as e:
        driver.save_screenshot("login_elements_wait_error.png")
        driver.quit()
        raise AssertionError(f"Не вдалося знайти елементи форми логіну. Скріншот збережено. Помилка: {e}")
    
    # Взаємодія
    email_input.clear()
    email_input.send_keys(ADMIN_EMAIL)
    
    password_input.clear()
    password_input.send_keys(ADMIN_PASSWORD)
    
    submit_button.click()
    print("[INFO] Login form submitted.")
    
    # Чекаємо зміни URL сторінки
    wait.until(EC.url_changes(BASE_URL))
    time.sleep(1) # коротка пауза для рендеру дашборду
    
    # Очікуємо завантаження головного тексту на дашборді
    welcome_heading = wait.until(
        EC.visibility_of_element_located((By.TAG_NAME, "h1"))
    )
    
    print(f"[INFO] Welcome page loaded. Heading text: '{welcome_heading.text}'")
    print("[SUCCESS] Login E2E Test Passed!")
    driver.quit()