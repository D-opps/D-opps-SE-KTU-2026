import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from conftest import ADMIN_EMAIL, ADMIN_PASSWORD, BASE_URL

def test_dashboard_and_admin_analytics_flow(logged_in_driver):
    """
    Комплексний E2E тест головної сторінки з синхронним очікуванням React State.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 20)  # Даємо API достатньо часу для відповіді

    # Відкриваємо базову сторінку
    driver.get(BASE_URL)
    print("\n[INFO] Ensuring user is authorized...")
    
    try:
        # Авторизуємось через інтерфейс форми
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

    # ==========================================
    # КРОК 0: СИНХРОНІЗАЦІЯ З REACT LOADER
    # ==========================================
    # Спершу чекаємо, поки лоадер (якщо він з'явився) зникне з DOM-структури
    try:
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "animate-spin")))
        print("  - Spinner detected. Waiting for Django API metrics response...")
        wait.until_not(EC.presence_of_element_located((By.CLASS_NAME, "animate-spin")))
        print("  - Spinner disappeared. UI fully rendered.")
    except Exception:
        print("  - Spinner was too fast or already gone. Checking page content...")

    # ==========================================
    # КРОК 1: ПЕРЕВІРКА ВІТАЛЬНОГО БАНЕРА
    # ==========================================
    try:
        # Шукаємо заголовок h1 незалежно від регістру чи імені користувача всередині банера
        welcome_heading = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h1"))
        )
        print(f"[INFO] Header banner successfully loaded! Text: '{welcome_heading.text}'")
        assert "Hey" in welcome_heading.text or "Welcome" in driver.page_source, "Не знайдено вітальний текст"
    except Exception as e:
        driver.save_screenshot("dashboard_banner_error.png")
        raise AssertionError(f"Головний банер не завантажився. Поточний URL: {driver.current_url}. Помилка: {e}")

    # ==========================================
    # КРОК 2: АДМІНСЬКА АНАЛІТИКА ТА СЕЛЕКТОР
    # ==========================================
    print("[INFO] Validating Admin Analytics block...")
    try:
        analytics_title = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h2[contains(., 'Analytics') or contains(., 'Analytics')]"))
        )
        assert analytics_title.is_displayed(), "Секція аналітики не відображається"

        period_select = wait.until(
            EC.element_to_be_clickable((By.TAG_NAME, "select"))
        )
        period_select.click()
        option_30 = driver.find_element(By.XPATH, "//option[@value='30']")
        option_30.click()
        
        time.sleep(1.5)  # Очікування на оновлення стейту після вибору 30 днів
        
        total_users_card = driver.find_element(By.XPATH, "//*[contains(text(), 'Users') or contains(text(), 'Total')]")
        assert total_users_card.is_displayed(), "Картки метрик не відрендерились"
        print("  - Analytics dropdown and cards validated successfully.")
    except Exception as e:
        driver.save_screenshot("dashboard_analytics_error.png")
        raise AssertionError(f"Помилка тестування блоку адмін-метрики: {e}")

    # ==========================================
    # КРОК 3: ШВИДКІ ДІЇ (QUICK ACTIONS)
    # ==========================================
    print("[INFO] Checking Quick Action Cards navigation paths...")
    try:
        laundry_card = driver.find_element(By.XPATH, "//a[contains(@href, '/laundry')]")
        chat_card = driver.find_element(By.XPATH, "//a[contains(@href, '/chat')]")
        
        assert laundry_card.is_displayed(), "Картка Laundry Room відсутня"
        assert chat_card.is_displayed(), "Картка Community Chat відсутня"
        print("  - Quick action links mapped correctly to target routes.")
    except Exception as e:
        raise AssertionError(f"Помилка перевірки карток навігації: {e}")

    # ==========================================
    # КРОК 4: СТРІЧКА ПОВІДОМЛЕНЬ (COMMUNITY BUZZ)
    # ==========================================
    print("[INFO] Checking Community Buzz block...")
    try:
        buzz_section = driver.find_element(By.XPATH, "//h2[contains(text(), 'Buzz') or contains(text(), 'Community')]")
        assert buzz_section.is_displayed(), "Секція стрічки повідомлень відсутня"
        print("  - Feed container validated.")
    except Exception as e:
        raise AssertionError(f"Помилка перевірки стрічки Community Buzz: {e}")

    print("\n[SUCCESS] Dashboard & Admin Analytics E2E Test Passed!")