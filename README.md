# 🛡️ J.A.R.V.I.S. — Tactical Mission Control (Stark OS)

ระบบ AI Assistant & Autonomous Computer Automation Agent สไตล์ Stark OS HUD พร้อมระบบ Multi-Key Load Balancing (Groq & Gemini)

---

## 🚀 วิธีการรันโปรเจกต์ (Quick Start Guide)

### 1. เปิด Terminal และเข้าไปที่โฟลเดอร์โปรเจกต์
```bash
cd /home/rathanan/javis
```

### 2. เปิดใช้งาน Virtual Environment (venv)
```bash
source .venv/bin/activate
```
*(เมื่อเปิดสำเร็จ จะมีคำว่า `(.venv)` ปรากฏขึ้นที่หน้าบรรทัดคำสั่ง)*

### 3. ตรวจสอบการติดตั้งแพ็กเกจ (ทำครั้งแรก หรือเมื่อมีการอัปเดตโค้ด)
```bash
pip install -r requirements.txt
playwright install chromium
```

### 4. ตรวจสอบไฟล์ `.env`
ตรวจสอบว่ามีไฟล์ `.env` ในโฟลเดอร์หลักพร้อมคีย์ API:
```env
GROQ_API_KEY=gsk_your_groq_key1, gsk_your_groq_key2
GEMINI_API_KEY=AIzaSy_your_gemini_key1
```
*(สามารถไปเพิ่มหรือแก้ไขผ่านหน้าต่าง Settings บนเว็บได้เช่นกัน)*

### 5. คำสั่งเริ่มรันเซิร์ฟเวอร์ (Start Server)
สามารถเลือกใช้คำสั่งใดคำสั่งหนึ่งด้านล่างนี้:

**แบบที่ 1 (แนะนำ - มี Auto-Reload เมื่อแก้โค้ด):**
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**แบบที่ 2 (แบบง่าย):**
```bash
python3 main.py
```

### 6. เปิดใช้งานในเบราว์เซอร์
เมื่อหน้าจอขึ้นข้อความ:
```text
⚡ [STARK OS] J.A.R.V.I.S. Protocol Initialized. All systems nominal, Sir.
INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
ให้เปิดเว็บเบราว์เซอร์แล้วไปที่:
👉 **[http://localhost:8000](http://localhost:8000)** หรือ **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🛑 วิธียกเลิก / หยุดการรันเซิร์ฟเวอร์
- กดปุ่ม **`Ctrl + C`** บน Terminal ที่รันอยู่

---

## 📁 โครงสร้างโปรเจกต์หลัก (Core Structure)
- `main.py` : จุดเริ่มต้นเซิร์ฟเวอร์ FastAPI และ Route API ต่างๆ
- `ai_engine.py` : สมอง AI รองรับโมเดล Groq LPU (Llama 3.3, DeepSeek R1) และ Gemini 2.5 Flash
- `key_manager.py` : ระบบจัดการ Multi-Key Pool, Round-Robin หมุนเวียนคีย์ และตัดคีย์เสีย
- `browser_agent.py` : ระบบ Sandbox Automation ควบคุมเว็บเบราว์เซอร์
- `static/` : ไฟล์หน้าเว็บ (HTML, CSS, JavaScript) สำหรับ Stark HUD UI
- `javis.db` : ฐานข้อมูล SQLite เก็บยุทธการ (Goals), ภารกิจ (Tasks) และประวัติแชท
