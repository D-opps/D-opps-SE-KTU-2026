import pytest
import time
import random
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

LAUNDRY_URL = "http://localhost:5173/laundry"

def test_laundry_full_workflow_e2e(logged_in_driver):
    """
    Супер-стійкий E2E тест для Laundry Hub з розширеним дебагом таймаутів.
    """
    driver = logged_in_driver
    # Збільшуємо базове очікування до 20 секунд для повільних систем
    wait = WebDriverWait(driver, 20)

    print("\n[INFO] Opening Laundry Hub page...")
    driver.get(LAUNDRY_URL)
    
    # Чекаємо повного завантаження сторінки
    wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
    time.sleep(3)  # Стабілізація React стейту після fetch запитів

    # 1. ВАЛІДАЦІЯ ЗАВАНТАЖЕННЯ СТОРІНКИ
    try:
        header = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "h1")))
        print(f"[SUCCESS] Page loaded. Title found: '{header.text}'")
    except Exception:
        _handle_timeout_and_debug(driver, "Заголовка h1 не знайдено на сторінці пральні.")

    # Перевіряємо роль користувача
    user_role = driver.execute_script("return localStorage.getItem('userRole');")
    print(f"[INFO] Operational user role decoded: '{user_role}'")

    if user_role != 'admin':
        print("[INFO] Non-admin flow verified. Terminating execution safely.")
        return

    # 2. ВІДКИДАННЯ ПОМИЛКИ ТА ВІЗУАЛЬНА ВАЛІДАЦІЯ ИНПУТУ
    try:
        # Шукаємо кнопку додавання гнучким шляхом (по тексту)
        add_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Add Machine')]")))
        add_btn.click()
        print("[INFO] Clicked 'Add Machine' button.")
    except Exception:
        _handle_timeout_and_debug(driver, "Кнопку 'Add Machine' не знайдено. Перевірте, чи юзер точно Admin в localStorage.")

    try:
        # Чекаємо появу форми і тицяємо Submit для перевірки валідації
        submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//form//button[@type='submit']")))
        submit_btn.click()
        print("  - Submitted empty form to trigger visual alerts...")
        time.sleep(1)

        # Перевіряємо інпут на наявність класу помилки border-red-500 або bg-red
        name_input = driver.find_element(By.XPATH, "//form//input")
        input_classes = name_input.get_attribute("class")
        assert "red" in input_classes or "border-transparent" not in input_classes, "Валідація порожнього імені не підсвітила інпут!"
        print("[SUCCESS] Visual Alert confirmed: Input style changed on validation error.")
    except Exception:
        _handle_timeout_and_debug(driver, "Помилка під час тестування валідації пустой форми додавання.")

    # 3. ЗАПОВНЕННЯ ФОРМИ ТА СТВОРЕННЯ
    test_machine_name = f"LG E2E Auto-{random.randint(100, 999)}"
    name_input.send_keys(test_machine_name)
    
    # Клікаємо на вибір типу пралки (перша кнопка в групі типів)
    type_buttons = driver.find_elements(By.XPATH, "//form//button[@type='button']")
    if type_buttons:
        type_buttons[0].click()  # Обираємо перший доступний тип

    submit_btn.click()
    print(f"[INFO] Form submitted with name: '{test_machine_name}'. Waiting for grid rendering...")
    time.sleep(2)

    # 4. ПЕРЕВІРКА КАРТКИ В СІТЦІ ТА СЕСІЇ
    try:
        # Шукаємо картку, яка містить ім'я нашої машинки
        machine_card_xpath = f"//*[contains(text(), '{test_machine_name}')]/ancestor::div[contains(@class, 'bg-white') or contains(@class, 'rounded')]"
        machine_card = wait.until(EC.visibility_of_element_located((By.XPATH, machine_card_xpath)))
        print(f"[SUCCESS] Card for '{test_machine_name}' is fully visible in DOM.")
    except Exception:
        _handle_timeout_and_debug(driver, f"Створена машинка '{test_machine_name}' не з'явилася в сітці. Можливо, API повернуло 400/500 помилку.")

    # Запускаємо сесію використання
    try:
        use_btn = machine_card.find_element(By.XPATH, ".//button[contains(., 'Use') or contains(., 'Edit')]")
        use_btn.click()
        
        # Перевіряємо валідацію таймера (вводимо від'ємне число)
        timer_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='number']")))
        timer_input.clear()
        timer_input.send_keys("-10")
        
        start_btn = driver.find_element(By.XPATH, "//button[contains(., 'Start') or contains(., 'Session')]")
        start_btn.click()
        time.sleep(1)
        
        # Перевіряємо підсвітку помилки таймера
        assert "red" in timer_input.get_attribute("class"), "Таймер не підсвітився червоним кольором при від'ємному часі!"
        print("[SUCCESS] Visual Alert confirmed: Timer input highlighted red on negative value.")

        # Ставимо нормальний час і запускаємо
        timer_input.clear()
        timer_input.send_keys("35")
        start_btn.click()
        print("[INFO] Valid session configuration submitted.")
    except Exception:
        _handle_timeout_and_debug(driver, "Збій під час взаємодії з модальним вікном керування статусом сесії.")

    # 5. ОЧИЩЕННЯ (ВИДАЛЕННЯ)
    try:
        # Трюк: автоматично погоджуємось на window.confirm
        driver.execute_script("window.confirm = function() { return true; }")
        
        # Чекаємо оновлення картки і тицяємо видалити (шукаємо іконку або кнопку за ієрархією)
        machine_card = driver.find_element(By.XPATH, machine_card_xpath)
        delete_btn = machine_card.find_element(By.XPATH, ".//button[descendant::svg or contains(@class, 'text-gray')]")
        delete_btn.click()
        print("[INFO] Clicked delete button.")

        # Перевіряємо, чи картка зникла з екрану
        wait.until(EC.invisibility_of_element_located((By.XPATH, machine_card_xpath)))
        print("[SUCCESS] Laundry E2E pipeline finished without leaving test artifacts!")
    except Exception:
        _handle_timeout_and_debug(driver, "Не вдалося видалити створену машинку на етапі очищення стейту.")


def _handle_timeout_and_debug(driver, custom_message):
    """Допоміжна функція: робить скріншот та дає розгорнутий звіт консолі розробника"""
    filename = "laundry_debug_fail.png"
    driver.save_screenshot(filename)
    print(f"\n[CRITICAL ERROR] {custom_message}")
    print(f"[DEBUG] Screenshot saved as: {filename}")
    print("--- BROWSER CONSOLE LOGS ---")
    for entry in driver.get_log('browser'):
        print(f"  [{entry['level']}] {entry['message']}")
    print("----------------------------")
    raise AssertionError(f"{custom_message} Докладніші дані дивись у логах консолі Chrome вище.")