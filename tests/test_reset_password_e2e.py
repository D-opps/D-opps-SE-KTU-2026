import pytest
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Симулюємо перехід за посиланням з пошти, де унікальний токен = dynamic-token-xyz
RESET_URL = "http://localhost:5173/reset-password/dynamic-token-xyz"

@pytest.fixture(scope="function")
def clean_driver():
    """Ініціалізує ізольований браузер без додаткових сесій"""
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


def test_reset_password_validation_and_success(clean_driver):
    driver = clean_driver
    wait = WebDriverWait(driver, 10)

    print("\n[STEP 1] Підготовка стійкого моку для Django API через sessionStorage...")
    # Мокаємо успішну відповідь від django-rest-passwordreset (код 200)
    mock_api_script = """
    (function() {
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && url.includes('/api/password_reset/confirm/')) {
                this.addEventListener('load', function() {
                    Object.defineProperty(this, 'status', { writable: true, value: 200 });
                    Object.defineProperty(this, 'responseText', { writable: true, value: '{"status": "OK"}' });
                });
            }
            return origOpen.apply(this, arguments);
        };
    })();
    """
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {"source": mock_api_script})

    print("[STEP 2] Відкриття сторінки скидання пароля...")
    driver.get(RESET_URL)

    # Переконуємося, що сторінка DormLife завантажилась
    wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[text()='DormLife']")))
    
    # Знаходимо поля інпутів
    password_input = driver.find_element(By.XPATH, "//label[text()='New Password']/following::input[1]")
    confirm_input = driver.find_element(By.XPATH, "//label[text()='Confirm Password']/following::input[1]")
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")

    print("[STEP 3] Перевірка валідації сили пароля на занадто слабкий пароль...")
    # Вводимо пароль, що не відповідає вимогам (немає великої літери та цифри)
    password_input.send_keys("weakpass")
    confirm_input.send_keys("weakpass")
    
    driver.execute_script("arguments[0].click();", submit_btn)

    # Очікуємо появу повідомлення про помилку валідації
    error_box = wait.until(EC.visibility_of_element_located((By.XPATH, "//p[contains(text(), 'Password does not meet all requirements')]")))
    assert error_box.is_displayed(), "Екран не заблокував відправку слабкого пароля!"
    print("  -> Інтерфейс успішно заблокував слабкий пароль.")

    print("[STEP 4] Перевірка валідації на невідповідність паролів...")
    # Очищаємо поля
    password_input.clear()
    confirm_input.clear()
    
    # Вводимо сильний пароль, але різні значення в поля підтвердження
    password_input.send_keys("SecurePass123!")
    confirm_input.send_keys("DifferentPass123!")
    
    driver.execute_script("arguments[0].click();", submit_btn)
    
    wait.until(EC.text_to_be_present_in_element((By.XPATH, "//div[contains(@class, 'bg-red-50')]//p"), "Passwords do not match."))
    print("  -> Інтерфейс успішно виявив невідповідність паролів.")

    print("[STEP 5] Введення коректних даних та успішне скидання...")
    confirm_input.clear()
    confirm_input.send_keys("SecurePass123!") # Тепер паролі збігаються і є сильними
    
    # Клікаємо на відправку форми
    driver.execute_script("arguments[0].click();", submit_btn)

    print("[STEP 6] Валідація Success-екрану...")
    # Компонент React у разі успіху рендерить альтернативний блок з CheckCircle та кнопкою редиректу
    wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[text()='Success!']")))
    
    success_text = driver.find_element(By.XPATH, "//p[contains(text(), 'Your password has been updated')]")
    assert success_text.is_displayed()
    
    # Перевіряємо наявність кнопки швидкого переходу на логін
    login_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Go to Login Now')]")
    assert login_link.is_displayed()
    print("🎉 Тест успішно пройдено! Пароль оновлено, Success-екран відображено.")