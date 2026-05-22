import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- Константи конфігурації додатка ---
BASE_URL = "http://localhost:5173/login"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Qwerty_21"


@pytest.fixture(scope="function")
def driver():
    """
    Pytest Фікстура для ініціалізації вебдрайвера.
    Автоматично завантажує сумісну версію ChromeDriver та закриває браузер після тесту.
    """
    # Автоматичне налаштування ChromeDriver за допомогою webdriver-manager
    service = Service(ChromeDriverManager().install())
    
    # Створення екземпляру Chrome драйвера
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Розкоментуй, якщо хочеш запускати тест у фоновому режимі (без відкриття вікна браузера)
    
    chrome_driver = webdriver.Chrome(service=service, options=options)
    chrome_driver.maximize_window()
    
    # Передаємо драйвер у тест
    yield chrome_driver
    
    # Фіналізація: гарантоване закриття браузера після завершення тесту
    chrome_driver.quit()


def test_admin_login_and_dashboard_welcome(driver):
    """
    End-to-End тест для перевірки успішної автентифікації адміністратора
    та рендерингу вітального банера на Dashboard.
    """
    
    # 1. Відкриваємо сторінку логіну React-додатка
    driver.get(BASE_URL)
    
    # Налаштовуємо WebDriverWait (Explicit Wait) на макс. 10 секунд
    wait = WebDriverWait(driver, 10)
    
    # 2. Очікуємо появи полів форми та заповнюємо їх
    # Шукаємо поля за селекторами атрибуту name (або за типом input)
    # 2. Очікуємо появи полів форми та заповнюємо їх
    # Шукаємо поле Email за плейсхолдером або типом (більш гнучкий пошук)
    try:
        email_input = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='email' or @type='text' or contains(@placeholder, 'Email') or contains(@placeholder, 'email')]"))
        )
        print("\n[INFO] Email input field successfully located!")
    except Exception:
        # Якщо впаде, ми зробимо скріншот, щоб ти побачила, що було на екрані
        driver.save_screenshot("login_page_error.png")
        raise AssertionError("Не вдалося знайти поле введення Email. Скріншот збережено як login_page_error.png")

    # Шукаємо поле Паролю за типом або плейсхолдером
    password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@placeholder, 'Password') or contains(@placeholder, 'пароль')]")
    
    # Шукаємо кнопку Submit за типом або текстом всередині
    submit_button = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Login') or contains(text(), 'Sign In') or contains(text(), 'Увійти')]")
    
    # Вводимо тестові валідні дані адміністратора
    email_input.send_keys(ADMIN_EMAIL)
    password_input.send_keys(ADMIN_PASSWORD)
    
    # 3. Натискаємо кнопку входу
    submit_button.click()
    
    # 4. Очікуємо перенаправлення на Dashboard та завантаження Django-метрик
    # Шукаємо h1, який має клас 'text-4xl' (це наш банер), або просто чекаємо текст "Hey,"
    try:
        welcome_heading = wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "h1.text-4xl"))
        )
    except Exception:
        # Якщо за класом не знайшло, спробуємо знайти будь-який елемент, що містить "Hey,"
        try:
            welcome_heading = wait.until(
                EC.visibility_of_element_located((By.XPATH, "//*[contains(text(), 'Hey,')]"))
            )
        except Exception:
            driver.save_screenshot("dashboard_not_loaded.png")
            raise AssertionError("Не вдалося знайти вітальний заголовок на Dashboard. Скріншот збережено.")

    # 5. Очікуваний результат (Assertion)
    actual_text = welcome_heading.text
    print(f"\n[INFO] Found welcome message text: '{actual_text}'")
    
    assert "Hey," in actual_text, (
        f"Помилка: Заголовок не містить очікуваного привітання. Отримано: '{actual_text}'"
    )
    
    print("\n[SUCCESS] E2E Test Passed Successfully!")
    
    # Додаткова перевірка: переконуємося, що на сторінці з'явився блок аналітики для Адміна
    # (Це підтверджує, що роль відпрацювала правильно і токен пройшов валідацію)
    admin_badge = driver.find_element(By.XPATH, "//*[contains(text(), 'admin') or contains(text(), 'Admin')]")
    assert admin_badge.is_displayed(), "Помилка: Роль користувача не відображається на сторінці!"