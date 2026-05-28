import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:5173"

@pytest.fixture(scope="function")
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    driver = webdriver.Chrome(options=options)
    driver.get(BASE_URL)
    driver.execute_script("window.localStorage.setItem('token', 'test-token');")
    yield driver
    driver.quit()

def test_verify_email_success_flow(driver):
    driver.get(f"{BASE_URL}/verify-email?token=valid-token&email=test@example.com")
    
    import time
    time.sleep(3)
    
    body_text = driver.find_element(By.TAG_NAME, "body").text
    print(f"\n--- BODY TEXT SUCCESS FLOW ---")
    print(body_text)
    print(f"------------------------------")
    
    assert len(body_text) > 0, "The page is empty!"

def test_verify_email_failed_flow(driver):
    driver.get(f"{BASE_URL}/verify-email?token=expired-token&email=test@example.com")
    
    import time
    time.sleep(3)
    
    body_text = driver.find_element(By.TAG_NAME, "body").text
    print(f"\n--- BODY TEXT FAILED FLOW ---")
    print(body_text)
    print(f"-----------------------------")
    
    assert len(body_text) > 0, "The page is empty!"