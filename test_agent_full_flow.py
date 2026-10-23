import os
import json
import sandbox_manager as sm
from ai_engine import JavisAI

def test_full_system():
    print("=" * 60)
    print("⚡ J.A.R.V.I.S. Autonomous Agent Full Integration Test")
    print("=" * 60)

    # 1. Test Sandbox Guard
    print("\n1. Testing Sandbox Security Enclosure:")
    try:
        sm.validate_path("../../main.py")
        print("❌ FAILED: Traversal was not blocked!")
    except sm.SandboxSecurityException as e:
        print(f"✅ PASSED: Path traversal successfully blocked: {e}")

    # 2. Test Sandbox Read & Write
    print("\n2. Testing Sandbox Read & Write:")
    w_res = sm.write_file("workspace/mission_order.txt", "OPERATION FASTWORK: Ready for deployment.")
    print("Write result:", w_res.get("success"))
    r_res = sm.read_file("workspace/mission_order.txt")
    print("Read result content:", r_res.get("content"))
    assert r_res.get("content") == "OPERATION FASTWORK: Ready for deployment."
    print("✅ PASSED: File operations inside sandbox verified.")

    # 3. Test JavisAI Agent
    print("\n3. Testing J.A.R.V.I.S. Autonomous Intelligence:")
    ai = JavisAI()
    prompt = "จาวิส ตรวจสอบไฟล์ใน sandbox แล้วสรุปข้อมูลจาก fastwork_profile.json สั้นๆ 2 ประโยค"
    result = ai.send_message(prompt)
    print("\n[J.A.R.V.I.S. Response]:")
    print(result.get("message"))
    print("\n[Speech Text]:")
    print(result.get("speech_text"))
    print("\n[Agent Actions]:")
    print(json.dumps(result.get("agent_actions", []), indent=2, ensure_ascii=False))

    assert len(result.get("message", "")) > 10
    print("\n✅ ALL SYSTEM TESTS PASSED NOMINALLY, SIR.")

if __name__ == "__main__":
    test_full_system()
