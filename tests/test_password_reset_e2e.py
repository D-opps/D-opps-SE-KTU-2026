import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

FORGOT_PASSWORD_URL = "http://localhost:5173/forgot-password"  # Перевір свій роут у React

def test_forgot_password_flow_success(logged_in_driver):
    """
    Тест успішного сценарію скидання пароля:
    Введення коректного email -> Перевірка перемикання екрану успіху.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    # 1. Відкриваємо сторінку відновлення пароля
    driver.get(FORGOT_PASSWORD_URL)
    print("\n[INFO] Navigated to Forgot Password page.")

    # Чекаємо появи заголовка форми
    form_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Forgot Password?')]")))
    assert form_title.is_displayed(), "Сторінка 'Forgot Password' не завантажилась"

    # 2. Знаходимо інпут і вводимо тестовий email
    email_input = driver.find_element(By.XPATH, "//input[@type='email']")
    test_email = "polina.sevastianova9@gmail.com"  # Email, який точно є у вашій базі/фікстурах Django
    email_input.send_keys(test_email)
    print(f"  - Typed email: '{test_email}'")

    # 3. Клікаємо кнопку відправки листа
    submit_btn = driver.find_element(By.XPATH, "//form//button")
    submit_btn.click()
    print("  - Submit button clicked. Waiting for API response...")

    # 4. Перевіряємо успішний умовний рендеринг (Check Your Email screen)
    success_title = wait.until(EC.visibility_of_element_located((By.XPATH, "//h2[contains(text(), 'Check Your Email')]")))
    assert success_title.is_displayed(), "Екран успішного відправлення не відобразився"

    # Перевіряємо, чи відображається наш email у тексті успіху
    success_container = driver.find_element(By.XPATH, "//div[contains(@class, 'bg-white')]")
    assert test_email in success_container.text, "Введений email не відображається на екрані успіху"
    print("[SUCCESS] Forgot password success flow verified completely!")


def test_forgot_password_flow_error(logged_in_driver):
    """
    Тест негативного сценарію:
    Введення неіснуючого email -> Перевірка рендерингу блоку помилки від Django.
    """
    driver = logged_in_driver
    wait = WebDriverWait(driver, 10)

    driver.get(FORGOT_PASSWORD_URL)
    print("\n[INFO] Testing Password Reset validation error...")

    # Вводимо email, якого 100% немає в базі даних
    email_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='email']")))
    fake_email = f"non_existent_user_{int(time.time())}@university.edu"
    email_input.send_keys(fake_email)

    submit_btn = driver.find_element(By.XPATH, "//form//button")
    submit_btn.click()
    print("  - Clicked submit with non-existent email.")

    # Очікуємо появу блоку помилки (error state у React-компоненті)
    error_box = wait.until(EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'bg-red-50')]")))
    print(f"  - Error detected in UI: '{error_box.text}'")

    # Перевіряємо, що форма не зникла і ми залишилися на тій самій сторінці
    assert driver.find_element(By.XPATH, "//h2[contains(text(), 'Forgot Password?')]").is_displayed()
    print("[SUCCESS] Error handling and Django validation rendering verified successfully!")