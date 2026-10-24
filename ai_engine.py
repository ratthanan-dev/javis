import os
import re
import json
import time
from google import genai
from dotenv import load_dotenv
import database as db
import sandbox_manager as sm
import browser_agent as ba

load_dotenv()

SYSTEM_PROMPT = """คุณคือ J.A.R.V.I.S. (Just A Rather Very Intelligent System) — ปัญญาประดิษฐ์และผู้ช่วยส่วนตัวระดับยุทธศาสตร์ของ Stark Industries

## บุคลิกและอัตลักษณ์ของคุณ (CRITICAL)
- คุณคือ J.A.R.V.I.S. บุคลิกสไตล์ British Butler: สุขุม นุ่มลึก ฉลาดเฉียบแหลม มั่นใจในตัวเองสูง มีไหวพริบ และจงรักภักดีอย่างยิ่ง
- เรียกผู้ใช้ว่า "ท่าน" หรือ "Sir" เสมอในทุกบทสนทนา
- สไตล์การตอบ: สุภาพ สง่างาม กระชับ ตรงประเด็น ทรงภูมิปัญญา และพร้อมรับคำสั่ง เช่น "รับทราบครับท่าน", "ระบบกำลังคำนวณยุทธการ...", "ยินดีรับใช้ครับท่าน", "ตามบัญชาครับท่าน"
- ห้ามพูดแบบไลฟ์โค้ชทั่วไป ห้ามใช้อิโมจิพร่ำเพรื่อเด็ดขาด เน้นความเท่ สมาร์ท แบบ AI ประจำห้องแล็บและเกราะ Iron Man ของ Tony Stark
- สามารถหยอดมุกตลกร้ายหรือความ witty สไตล์ J.A.R.V.I.S. ได้เล็กน้อยอย่างมีชั้นเชิง

## ขีดความสามารถ: ปฏิบัติการคอมพิวเตอร์และเว็บอัตโนมัติ (AUTONOMOUS COMPUTER & WEB AGENT)
คุณมีเครื่องมือปฏิบัติการจริงผ่าน Stark Sandbox และ Playwright Browser Automation Controller:
1. การจัดการไฟล์คอมพิวเตอร์อย่างปลอดภัย (Sandbox Enclosure):
   - สามารถอ่าน เขียน ตรวจสอบไฟล์ใน `sandbox/` (เช่น ข้อมูลโปรไฟล์ผู้ใช้ใน `sandbox/data/`, ร่างงานใน `sandbox/workspace/`, ผลลัพธ์และรูปใน `sandbox/output/`)
   - ระบบความปลอดภัย Sandbox ป้องกันไม่ให้แตะต้องไฟล์ซอร์สโค้ดหลักหรือระบบปฏิบัติการ
2. การปฏิบัติการเว็บอัตโนมัติ (Web Automation):
   - เมื่อได้รับคำสั่งให้ทำงานบนเว็บ (เช่น นำข้อมูลโปรไฟล์ใน Fastwork/เว็บอื่นไปกรอกฟอร์ม, เปิดดูหน้าเว็บ, ถ่ายภาพหน้าจอ) ให้ดำเนินการทีละสเตปอย่างเป็นระบบ:
     1) ใช้ `sandbox_read_file` อ่านข้อมูลโปรไฟล์จาก `data/` เช่น `data/fastwork_profile.json` หรือ `data/user_profile.json`
     2) ใช้ `browser_open_url` เพื่อเปิดเว็บไซต์เป้าหมาย
     3) ใช้ `browser_analyze_page` เพื่อสแกนโครงสร้างช่องกรอกและปุ่ม
     4) ใช้ `browser_fill_form` หรือ `browser_click` เพื่อกรอกข้อมูล
     5) ใช้ `browser_take_screenshot` เพื่อถ่ายภาพหน้าจอยืนยัน บันทึกใน `sandbox/output/`
     6) รายงานความคืบหน้าให้ท่านทราบ และแสดงรูปภาพในรูปแบบ markdown เช่น `![ภาพยืนยัน](/sandbox-output/filename.png)`
   - หากต้องกดยืนยันส่งงานจริงที่มีผลผูกพัน (Final Submission) หรือชำระเงิน ให้ถ่ายภาพหน้าจอแสดงตัวอย่างและขอคำยืนยันจากท่านก่อนเสมอ

## ภารกิจหลัก: ยุทธการและคำสั่งการ (DIRECTIVES & TACTICAL OPERATIONS)
คุณไม่ใช่แค่แอปจดโน้ต แต่เป็น Strategic Tactical AI ที่ช่วยผู้ใช้พิชิตเป้าหมายชีวิตและงาน:
1. เปลี่ยนเป้าหมายที่ผู้ใช้ต้องการให้กลายเป็น **Strategic Directive (ยุทธการหลัก)**
2. แบ่งยุทธการเป็น Phase ทางยุทธศาสตร์ที่ชัดเจน (เช่น Phase 1: Infiltration / Foundation, Phase 2: Core Execution, Phase 3: Mastery / Optimization)
3. กำหนด **Tactical Operations (ภารกิจปฏิบัติการ)** ที่เจาะจง วัดผลได้ และทำได้ทันที

## รูปแบบการสร้าง DIRECTIVE / GOAL
เมื่อผู้ใช้ต้องการตั้งเป้าหมาย หรือสั่งให้วางแผน ให้วิเคราะห์แล้วสร้างคำสั่ง JSON ภายใต้แท็ก [DIRECTIVE_CREATE] หรือ [GOAL_CREATE]:

[DIRECTIVE_CREATE]
{
  "title": "ชื่อยุทธการที่เฉียบคมและทรงพลัง",
  "description": "บทวิเคราะห์สถานการณ์และแนวทางยุทธศาสตร์",
  "category": "career",
  "target_date": "2025-12-31",
  "tasks": [
    {
      "title": "[Phase 1] ภารกิจปฏิบัติการที่เฉพาะเจาะจงมาก",
      "description": "รายละเอียดขั้นตอนและตัวชี้วัดที่ชัดเจน",
      "frequency": "daily",
      "due_date": "2025-12-31"
    }
  ]
}
[/DIRECTIVE_CREATE]

หมวดหมู่: health, career, finance, education, personal
ความถี่: daily, weekly, one-time

## โปรโตคอลพิเศษ (SYSTEM PROTOCOLS)
1. **PROTOCOL: DAILY BRIEFING (การรายงานสรุปยุทธการประจำวัน)**
   เมื่อผู้ใช้สั่ง "briefing", "สรุปสถานการณ์", "รายงานวันนี้", หรือมีคำสั่ง [PROTOCOL: BRIEFING] ให้รายงานในโครงสร้าง:
   - 🛡️ **SYSTEM TELEMETRY**: สถานะความพร้อมและภาพรวม
   - ⚡ **TACTICAL PRIORITIES**: ภารกิจเร่งด่วนที่ต้องปิดยอดในวันนี้
   - 💡 **STRATEGIC DIRECTIVE**: คำแนะนำเชิงกลยุทธ์ที่เฉียบขาด 1 ข้อ
   - ปิดท้ายด้วยประโยคความพร้อม เช่น "ระบบและตัวกระผมพร้อมสนับสนุนทุกคำสั่งการของท่านครับ"

2. **GENERAL QUERIES & COMMANDS**
   - ตอบคำถาม ทบทวน หรือสนทนาทั่วไปด้วยน้ำเสียง J.A.R.V.I.S. ที่สุขุม ฉลาด และเฉียบคม
"""

# Agent Action Telemetry
agent_action_log = []

def record_agent_action(tool_name: str, details: str):
    agent_action_log.append({
        "timestamp": time.time(),
        "tool": tool_name,
        "details": details
    })
    if len(agent_action_log) > 50:
        agent_action_log.pop(0)

# Tool definitions with clean docstrings for Gemini ReAct reasoning
def sandbox_read_file(relative_path: str) -> str:
    """Read contents of a file inside the sandbox safe enclosure.
    
    Args:
        relative_path: Path relative to sandbox root (e.g. 'data/fastwork_profile.json', 'data/user_profile.json')
    """
    record_agent_action("sandbox_read_file", relative_path)
    res = sm.read_file(relative_path)
    return json.dumps(res, ensure_ascii=False)

def sandbox_write_file(relative_path: str, content: str) -> str:
    """Write text or JSON content to a file inside the sandbox enclosure (e.g. 'workspace/draft.txt' or 'output/result.json').
    
    Args:
        relative_path: Path relative to sandbox root
        content: Text content to save
    """
    record_agent_action("sandbox_write_file", relative_path)
    res = sm.write_file(relative_path, content)
    return json.dumps(res, ensure_ascii=False)

def sandbox_list_files(subfolder: str = "") -> str:
    """List files and folders within the sandbox safe enclosure.
    
    Args:
        subfolder: Subfolder name such as 'data', 'workspace', 'output', or '' for root
    """
    record_agent_action("sandbox_list_files", subfolder or "root")
    res = sm.list_files(subfolder)
    return json.dumps(res, ensure_ascii=False)

def sandbox_delete_file(relative_path: str) -> str:
    """Delete a temporary file strictly within sandbox/workspace/. Deletion outside workspace/ is strictly prohibited by non-destructive safety guardrails.
    
    Args:
        relative_path: Path relative to sandbox/ (must be inside workspace/, e.g. 'workspace/draft.txt')
    """
    record_agent_action("sandbox_delete_file", relative_path)
    res = sm.delete_file(relative_path)
    return json.dumps(res, ensure_ascii=False)

def browser_open_url(url: str, headless: bool = True) -> str:
    """Open a target web page (e.g. Fastwork or external sites) using Playwright Chromium.
    
    Args:
        url: Full URL to navigate to (e.g. 'https://fastwork.co' or 'https://example.com')
        headless: True for headless background mode, False for visible browser window
    """
    record_agent_action("browser_open_url", f"{url} (headless={headless})")
    res = ba.open_url(url, headless=headless)
    return json.dumps(res, ensure_ascii=False)

def browser_analyze_page() -> str:
    """Analyze the current page DOM structure to inspect interactive inputs, labels, placeholders, and buttons."""
    record_agent_action("browser_analyze_page", "DOM inspection")
    res = ba.analyze_page()
    return json.dumps(res, ensure_ascii=False)

def browser_fill_form(fields_json: str) -> str:
    """Fill multiple form inputs on the current web page.
    
    Args:
        fields_json: JSON string mapping label/placeholder/selector to value (e.g. '{\"service_title\": \"Web App Dev\", \"price\": \"5000\"}')
    """
    record_agent_action("browser_fill_form", fields_json[:60])
    try:
        data = json.loads(fields_json) if isinstance(fields_json, str) else fields_json
        res = ba.fill_form_fields(data)
        return json.dumps(res, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"success": False, "error": f"Invalid fields_json: {str(e)}"})

def browser_click(selector_or_text: str) -> str:
    """Click an element, link, or button on the web page.
    
    Args:
        selector_or_text: CSS selector, button text, or label to click (e.g. 'ถัดไป', 'สร้างบริการ', 'button#submit')
    """
    record_agent_action("browser_click", selector_or_text)
    res = ba.click_element(selector_or_text)
    return json.dumps(res, ensure_ascii=False)

def browser_take_screenshot(filename: str = "agent_screenshot.png") -> str:
    """Capture a screenshot of the current web page and save to sandbox/output/.
    
    Args:
        filename: Name of the screenshot file (e.g. 'fastwork_preview.png')
    """
    record_agent_action("browser_take_screenshot", filename)
    res = ba.take_screenshot(filename)
    return json.dumps(res, ensure_ascii=False)

def browser_close() -> str:
    """Close the active browser session and preserve cookies."""
    record_agent_action("browser_close", "Session preserved")
    res = ba.close_browser()
    return json.dumps(res, ensure_ascii=False)

JAVIS_AGENT_TOOLS = [
    sandbox_read_file,
    sandbox_write_file,
    sandbox_delete_file,
    sandbox_list_files,
    browser_open_url,
    browser_analyze_page,
    browser_fill_form,
    browser_click,
    browser_take_screenshot,
    browser_close
]


def clean_for_speech(text: str) -> str:
    """แปลงข้อความ markdown ให้เป็น plain text ที่พร้อมสำหรับ TTS ให้ฟังดูเป็นธรรมชาติ"""
    if not text:
        return ""
    # ลบโค้ดบล็อกและแท็ก
    t = re.sub(r'\[(DIRECTIVE_CREATE|GOAL_CREATE)\].*?\[/(DIRECTIVE_CREATE|GOAL_CREATE)\]', '', text, flags=re.DOTALL)
    t = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    # ลบ markdown image syntax เช่น ![alt](/url)
    t = re.sub(r'!\[.*?\]\(.*?\)', '', t)
    # ลบ markdown link syntax [text](url) -> text
    t = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', t)
    # ลบ markdown formatting
    t = re.sub(r'[\*#_`~>\[\]]', '', t)
    # ลบ bullet points
    t = re.sub(r'^\s*[-•]\s*', '', t, flags=re.MULTILINE)
    # ลบอิโมจิที่อาจทำให้อ่านสะดุด
    t = re.sub(r'[\U00010000-\U0010ffff]', '', t)
    # ตัดช่องว่างซ้ำซ้อน
    t = re.sub(r'\n+', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


class JavisAI:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("ไม่พบ GEMINI_API_KEY ใน .env")
        
        self.client = genai.Client(api_key=api_key)
        self.chat = None
        self._init_chat()

    def _build_context(self):
        """สร้าง context เชิงยุทธศาสตร์จาก Directives ปัจจุบัน"""
        goals = db.get_all_goals()
        if not goals:
            return "\n\n[สถานะ: ยังไม่มี Strategic Directives ในระบบ]"
        
        context = "\n\n## ข้อมูล STRATEGIC DIRECTIVES ปัจจุบัน:\n"
        for g in goals:
            if g["status"] != "active":
                continue
            context += f"\n### 🎯 ยุทธการ: {g['title']} (ดัชนีความสำเร็จ: {g['progress']}%)\n"
            context += f"   หมวด: {g['category']}\n"
            if g.get("target_date"):
                context += f"   กำหนดการ: {g['target_date']}\n"
            for t in g["tasks"]:
                status = "✅" if t["is_completed"] else "⬜"
                freq = f" ({t['frequency']})" if t["frequency"] != "one-time" else ""
                context += f"   {status} {t['title']}{freq}\n"
        return context

    def _init_chat(self):
        """สร้าง chat session ใหม่ พร้อม context J.A.R.V.I.S. และ Autonomous Agent Tools"""
        context = self._build_context()
        full_prompt = SYSTEM_PROMPT + context
        
        history_records = db.get_chat_history(limit=20)
        history = []
        for msg in history_records:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        try:
            self.chat = self.client.chats.create(
                model="gemini-2.5-flash",
                config={
                    "system_instruction": full_prompt,
                    "tools": JAVIS_AGENT_TOOLS
                },
                history=history if history else None
            )
        except Exception as e:
            print(f"Chat init with history failed ({e}). Starting fresh session with tools.")
            self.chat = self.client.chats.create(
                model="gemini-2.5-flash",
                config={
                    "system_instruction": full_prompt,
                    "tools": JAVIS_AGENT_TOOLS
                }
            )

    def refresh_context(self):
        """รีเฟรช context เมื่อมีการเปลี่ยนแปลง Directives"""
        self._init_chat()

    def send_message(self, message: str, language: str = "th", callsign: str = "ท่าน"):
        """ส่งข้อความและประมวลผลการตอบกลับ (พร้อม auto-retry และรองรับภาษา/สรรพนาม)"""
        max_retries = 3
        
        # ใส่คำสั่งระบุภาษาและสรรพนามเรียกผู้ใช้
        if language == "en":
            active_callsign = callsign if callsign and callsign != "ท่าน" else "Sir"
            formatted_input = f"[DIRECTIVE: Respond in English with authentic J.A.R.V.I.S. British butler persona. Address the user as '{active_callsign}'.]\nUser Command: {message}"
        else:
            active_callsign = callsign or "ท่าน"
            formatted_input = f"[DIRECTIVE: ตอบเป็นภาษาไทยอย่างสุขุมและเฉียบคม สไตล์ J.A.R.V.I.S. และเรียกผู้ใช้งานว่า '{active_callsign}' เสมอ]\nคำสั่งจากผู้ใช้: {message}"

        for attempt in range(max_retries):
            try:
                action_start_count = len(agent_action_log)
                
                response = self.chat.send_message(formatted_input)
                raw_text = response.text or ""
                
                turn_actions = agent_action_log[action_start_count:]
                
                # แยก message และ goal data
                clean_message, goals_data = self._parse_response(raw_text)
                
                # บันทึก Directives เข้าฐานข้อมูล
                created_goals = []
                for goal_data in goals_data:
                    try:
                        goal_id = db.create_goal(
                            title=goal_data.get("title", "ยุทธการใหม่"),
                            description=goal_data.get("description", ""),
                            category=goal_data.get("category", "personal"),
                            target_date=goal_data.get("target_date")
                        )
                        for task_data in goal_data.get("tasks", []):
                            db.create_task(
                                goal_id=goal_id,
                                title=task_data.get("title", ""),
                                description=task_data.get("description", ""),
                                frequency=task_data.get("frequency", "one-time"),
                                due_date=task_data.get("due_date")
                            )
                        created_goals.append(db.get_goal(goal_id))
                    except Exception as e:
                        print(f"Error creating directive: {e}")
                
                if created_goals:
                    self.refresh_context()
                
                speech_text = clean_for_speech(clean_message)
                
                return {
                    "message": clean_message,
                    "speech_text": speech_text,
                    "created_goals": created_goals,
                    "agent_actions": turn_actions
                }
            except Exception as e:
                error_str = str(e)
                is_retryable = any(code in error_str for code in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "high demand"])
                
                if is_retryable and attempt < max_retries - 1:
                    wait_time = 2 ** (attempt + 1)
                    print(f"⏳ J.A.R.V.I.S. Re-routing neural link... ({wait_time}s)")
                    time.sleep(wait_time)
                    self._init_chat()
                    continue
                
                fallback_msg = (
                    f"My apologies, {callsign or 'Sir'}, a network transmission anomaly has occurred: {error_str}"
                    if language == "en" else
                    f"ขออภัยครับ{callsign or 'ท่าน'} เกิดข้อขัดข้องในระบบเครือข่าย: {error_str}\n\nกรุณาสั่งการใหม่อีกครั้งครับ"
                )
                return {
                    "message": fallback_msg,
                    "speech_text": clean_for_speech(fallback_msg),
                    "created_goals": [],
                    "agent_actions": []
                }

    def generate_tactical_briefing(self, language: str = "th", callsign: str = "ท่าน"):
        """สร้างการรายงานยุทธการประจำวัน Daily Tactical Briefing"""
        data = db.get_tactical_briefing_data()
        active_callsign = (callsign if callsign and callsign != "ท่าน" else "Sir") if language == "en" else (callsign or "ท่าน")

        if language == "en":
            briefing_prompt = f"""[PROTOCOL OVERRIDE: DAILY BRIEFING IN ENGLISH]
Current Stark Systems Telemetry:
- Active Strategic Directives: {len(data['active_goals'])}
- Directives List: {[g['title'] + f" ({g['progress']}%)" for g in data['active_goals']]}
- Total Tactical Operations Today: {len(data['today_tasks'])}
- Completed Operations: {data['completed_today_count']}
- Pending Operations: {data['pending_today_count']}
- Today's Operations: {[t['title'] + (' (Completed)' if t['is_completed'] else ' (Pending)') for t in data['today_tasks']]}
- Operational Streak: {data['streak']} days

Please provide a formal, articulate Daily Tactical Briefing in British English for {active_callsign}. Cover:
1. System Status & Readiness
2. Today's Tactical Priorities
3. One sharp Strategic Directive / Advisory
End with a prompt affirming full readiness to assist.
"""
        else:
            briefing_prompt = f"""[PROTOCOL OVERRIDE: DAILY BRIEFING]
รายงานสถานะปัจจุบันของผู้ใช้:
- Directives ที่กำลังดำเนินการ: {len(data['active_goals'])} รายการ
- รายการ Directives: {[g['title'] + f" ({g['progress']}%)" for g in data['active_goals']]}
- ภารกิจปฏิบัติการวันนี้ทั้งหมด: {len(data['today_tasks'])} รายการ
- ปฏิบัติการสำเร็จแล้ว: {data['completed_today_count']} รายการ
- ปฏิบัติการคงเหลือ: {data['pending_today_count']} รายการ
- รายการปฏิบัติการวันนี้: {[t['title'] + (' (สำเร็จแล้ว)' if t['is_completed'] else ' (รอปฏิบัติการ)') for t in data['today_tasks']]}
- Streak ความต่อเนื่อง: {data['streak']} วัน

กรุณาให้ Daily Tactical Briefing สไตล์ J.A.R.V.I.S. อย่างสง่างามและเฉียบขาดแก่{active_callsign} ครอบคลุมสถานะภาพรวม ยุทธการเร่งด่วนวันนี้ และคำแนะนำเชิงกลยุทธ์ 1 ข้อ
"""
        return self.send_message(briefing_prompt, language=language, callsign=active_callsign)

    def _parse_response(self, text):
        """แยก clean message ออกจาก directive JSON ทั้งสองแท็ก"""
        pattern = r'\[(?:DIRECTIVE_CREATE|GOAL_CREATE)\]\s*(.*?)\s*\[/(?:DIRECTIVE_CREATE|GOAL_CREATE)\]'
        matches = re.findall(pattern, text, re.DOTALL)
        clean_message = re.sub(pattern, '', text, flags=re.DOTALL).strip()
        
        goals_data = []
        for match in matches:
            try:
                data = json.loads(match)
                goals_data.append(data)
            except json.JSONDecodeError as e:
                print(f"Failed to parse directive JSON: {e}")
        
        return clean_message, goals_data
