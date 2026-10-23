import sandbox_manager as sm

# 1. Test write
res = sm.write_file("workspace/test_note.txt", "Stark Sandbox Test Passed")
assert res["success"], f"Write failed: {res}"

# 2. Test read
read_res = sm.read_file("workspace/test_note.txt")
assert read_res["content"] == "Stark Sandbox Test Passed", f"Read failed: {read_res}"

# 3. Test read template data
data_res = sm.read_file("data/user_profile.json")
assert data_res["success"], f"Read data failed: {data_res}"
assert data_res["json_data"]["full_name"].startswith("รัชชานนท์"), "JSON parse failed"

# 4. Test security breach block (path traversal)
leak_res = sm.read_file("../../main.py")
assert not leak_res["success"], "SECURITY TEST FAILED: Operation should have failed!"
assert "SECURITY BREACH" in leak_res["error"], f"Expected SECURITY BREACH in error, got: {leak_res}"

print("ALL SANDBOX SECURITY TESTS PASSED: OK")
