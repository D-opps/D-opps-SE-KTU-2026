import pytest
import time
import random

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


LAUNDRY_URL = "http://localhost:5173/laundry"


def test_laundry_full_workflow_e2e(logged_in_driver):

    driver = logged_in_driver

    wait = WebDriverWait(driver, 25)

    print("\n[INFO] Opening Laundry page...")

    driver.get(LAUNDRY_URL)

    driver.refresh()

    wait.until(
        lambda d: d.execute_script(
            "return document.readyState"
        ) == "complete"
    )

    time.sleep(3)


    wait.until(
        EC.url_contains("/laundry")
    )

    print("[INFO] Current URL:", driver.current_url)

    page_text = driver.find_element(By.TAG_NAME, "body").text

    assert "Laundry Hub" in page_text
    print("[SUCCESS] Laundry page loaded")


    role = driver.execute_script(
        "return localStorage.getItem('userRole');"
    )

    print(f"[INFO] Current role: {role}")

    assert role == "admin"

    add_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//button[contains(@class,'bg-indigo-600')]"
            )
        )
    )

    add_btn.click()

    print("[SUCCESS] Add modal opened")


    create_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//button[contains(., 'Create')]"
            )
        )
    )

    create_btn.click()

    time.sleep(1)

    body_text = driver.find_element(
        By.TAG_NAME,
        "body"
    ).text

    assert "Enter machine name" in body_text

    print("[SUCCESS] Validation toast works")


    machine_name = f"TEST-WASHER-{random.randint(1000,9999)}"

    name_input = wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                "//input[@placeholder='Machine name']"
            )
        )
    )

    name_input.send_keys(machine_name)

    create_btn.click()

    print(f"[INFO] Creating machine {machine_name}")

    wait.until(
        EC.invisibility_of_element_located(
            (
                By.XPATH,
                "//input[@placeholder='Machine name']"
            )
        )
    )


    machine_xpath = f"//*[contains(text(), '{machine_name}')]"

    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, machine_xpath)
        )
    )

    print("[SUCCESS] Machine card created")


    manage_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                f"//*[contains(text(), '{machine_name}')]/ancestor::div[contains(@class,'rounded')]//button[contains(., 'Manage')]"
            )
        )
    )

    manage_btn.click()

    print("[SUCCESS] Manage modal opened")

    start_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                "//button[contains(., 'Start')]"
            )
        )
    )

    start_btn.click()

    time.sleep(1)

    body_text = driver.find_element(
        By.TAG_NAME,
        "body"
    ).text

    assert "Enter your name" in body_text

    print("[SUCCESS] Empty name validation works")


    name_input = driver.find_element(
        By.XPATH,
        "//input[@placeholder='Your name']"
    )

    name_input.send_keys("QA Tester")

    timer_input = driver.find_element(
        By.XPATH,
        "//input[@type='number']"
    )

    timer_input.clear()

    timer_input.send_keys("-5")

    start_btn.click()

    time.sleep(1)

    body_text = driver.find_element(
        By.TAG_NAME,
        "body"
    ).text

    assert (
        "Minimum 1 minute" in body_text
        or "Maximum" in body_text
    )

    print("[SUCCESS] Timer validation works")

    timer_input.clear()

    timer_input.send_keys("30")

    start_btn.click()

    print("[INFO] Starting session")

    time.sleep(2)

    wait.until(
        EC.invisibility_of_element_located(
            (
                By.XPATH,
                "//button[contains(., 'Start')]"
            )
        )
    )

    print("[SUCCESS] Laundry session started")

    wait.until(
        EC.visibility_of_element_located(
            (
                By.XPATH,
                f"//*[contains(text(), '{machine_name}')]"
            )
        )
    )

    page_text = driver.find_element(
        By.TAG_NAME,
        "body"
    ).text

    assert "QA Tester" in page_text

    print("[SUCCESS] Occupied state visible")


    delete_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                f"//*[contains(text(), '{machine_name}')]/ancestor::div[contains(@class,'rounded')]//button[contains(@class,'bg-red-100')]"
            )
        )
    )

    delete_btn.click()

    print("[INFO] Delete clicked")

    time.sleep(2)

    wait.until_not(
        EC.presence_of_element_located(
            (
                By.XPATH,
                machine_xpath
            )
        )
    )

    print("[SUCCESS] Machine deleted successfully")