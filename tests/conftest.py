import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Універсальні налаштування для всього проєкту
BASE_URL = "http://localhost:5173/login"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Qwerty_21"

@pytest.fixture(scope="function")
def logged_in_driver():
    """
    Магічна фікстура: запускає браузер, виконує 100% залогін адміна
    за допомогою гнучких селекторів, що вже працювали, і повертає
    готове вікно.
    """
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    
    wait = WebDriverWait(driver, 10)
    
    # Сценарій логіну, який вже довів свою працездатність
    driver.get(BASE_URL)
    
    try:
        # Шукаємо поле email за гнучким XPATH
        email_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='email' or @type='text' or contains(@placeholder, 'Email') or contains(@placeholder, 'email')]"))
        )
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@placeholder, 'Password') or contains(@placeholder, 'пароль')]")
        submit_button = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Login') or contains(text(), 'Sign In') or contains(text(), 'Увійти')]")
        
        # Заповнюємо форму новими кредами
        email_input.send_keys(ADMIN_EMAIL)
        password_input.send_keys(ADMIN_PASSWORD)
        submit_button.click()
        
        # Переконуємось, що редірект відбувся
        wait.until(EC.url_changes(BASE_URL))
        time.sleep(1) # фіксація токена в системі
        
    except Exception as e:
        driver.save_screenshot("global_login_error.png")
        driver.quit()
        raise AssertionError(f"Глобальна фікстура не змогла авторизувати адміна. Помилка: {e}")
        
    yield driver
    driver.quit()