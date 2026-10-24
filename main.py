import os
import io
import time
import asyncio
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
import edge_tts

import database as db
from ai_engine import JavisAI, clean_for_speech

# สร้าง FastAPI app
app = FastAPI(title="J.A.R.V.I.S. — Tactical Mission Control (Stark OS)")

# สร้าง static directory ถ้ายังไม่มี
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "js"), exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount sandbox output directory for agent screenshots & artifacts preview
sandbox_output_dir = os.path.join(os.path.dirname(__file__), "sandbox", "output")
os.makedirs(sandbox_output_dir, exist_ok=True)
app.mount("/sandbox-output", StaticFiles(directory=sandbox_output_dir), name="sandbox-output")

# Middleware: ป้องกัน Browser Cache ป้องกันปัญหา CSS/JS เก่าค้าง
@app.middleware("http")
async def add_cache_control_header(request: Request, call_next):
    response = await call_next(request)
    if any(request.url.path.endswith(ext) for ext in [".html", ".css", ".js", ".json"]) or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Global AI instance & start time
javis_ai = None
start_timestamp = time.time()


@app.on_event("startup")
def startup():
    """เริ่มต้นระบบ Stark OS & J.A.R.V.I.S."""
    global javis_ai
    db.init_db()
    javis_ai = JavisAI()
    print("⚡ [STARK OS] J.A.R.V.I.S. Protocol Initialized. All systems nominal, Sir.")


# ==================== PAGES ====================

@app.get("/")
def serve_index():
    """หน้า HUD กลาง"""
    return FileResponse(
        os.path.join(static_dir, "index.html"),
        headers={"Cache-Control": "no-cache, no-store, must-revalidate, max-age=0"}
    )


# ==================== CHAT & PROTOCOLS API ====================

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "th"
    callsign: Optional[str] = "ท่าน"

@app.post("/api/chat")
def chat(req: ChatRequest):
    """ส่งคำสั่งหรือสนทนากับ J.A.R.V.I.S."""
    user_msg = req.message.strip()
    if not user_msg:
        return JSONResponse({"error": "กรุณาระบุคำสั่ง"}, status_code=400)
    
    # บันทึกข้อความผู้ใช้
    db.save_message("user", user_msg)
    
    # ส่งให้ J.A.R.V.I.S. ประมวลผล
    result = javis_ai.send_message(user_msg, language=req.language or "th", callsign=req.callsign or "ท่าน")
    
    # บันทึกข้อความ J.A.R.V.I.S.
    db.save_message("assistant", result["message"])
    
    return {
        "message": result["message"],
        "speech_text": result.get("speech_text", result["message"]),
        "created_goals": result["created_goals"],
        "agent_actions": result.get("agent_actions", [])
    }


@app.get("/api/agent/telemetry")
def get_agent_telemetry():
    """ดึงข้อมูลสถานะ Sandbox และ Telemetry ปฏิบัติการของ Agent"""
    import sandbox_manager as sm
    import browser_agent as ba
    from ai_engine import agent_action_log
    
    return {
        "status": "nominal",
        "sandbox_root": sm.SANDBOX_ROOT,
        "browser_active": ba.is_browser_active(),
        "recent_actions": agent_action_log[-20:],
        "sandbox_files": sm.list_files().get("files", [])
    }


class BriefingRequest(BaseModel):
    language: Optional[str] = "th"
    callsign: Optional[str] = "ท่าน"

@app.post("/api/briefing")
def trigger_briefing(req: Optional[BriefingRequest] = None):
    """เรียกโปรโตคอล Daily Tactical Briefing"""
    lang = req.language if req and req.language else "th"
    callsign = req.callsign if req and req.callsign else ("Sir" if lang == "en" else "ท่าน")

    # บันทึกข้อความคำสั่ง
    db.save_message("user", "⚡ PROTOCOL: DAILY BRIEFING")
    
    # สร้างการรายงานยุทธการ
    result = javis_ai.generate_tactical_briefing(language=lang, callsign=callsign)
    
    db.save_message("assistant", result["message"])
    
    return {
        "message": result["message"],
        "speech_text": result.get("speech_text", result["message"]),
        "created_goals": result["created_goals"]
    }


@app.get("/api/chat/history")
def get_chat_history():
    """ดึงประวัติการสื่อสาร Comms Log"""
    messages = db.get_chat_history(limit=100)
    return {"messages": messages}


@app.delete("/api/chat/history")
def clear_chat_history():
    """ล้างประวัติการสื่อสาร Comms Log"""
    db.clear_all_history()
    return {"success": True}


@app.delete("/api/tasks/completed")
def purge_completed_tasks():
    """ลบภารกิจปฏิบัติการที่ทำเสร็จแล้วออกจากระบบ"""
    db.clear_completed_tasks()
    return {"success": True}


# ==================== VOICE / TTS API ====================

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "th-TH-NiwatNeural"

async def generate_speech_audio(text: str, voice: str) -> bytes:
    """สร้างไบต์ไฟล์เสียง MP3 จาก Edge TTS โดยรองรับข้อความยาวแบบครบถ้วนไม่ตัดตอน (Chunking & Seamless Concatenation)"""
    # ถ้าข้อความสั้นกว่า 3,500 ตัวอักษร สังเคราะห์ตรงรอบเดียวรวดเร็ว
    if len(text) <= 3500:
        comm = edge_tts.Communicate(text, voice)
        stream = io.BytesIO()
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                stream.write(chunk["data"])
        return stream.getvalue()

    # ถ้าข้อความเป็นขนาดยาว (> 3,500 ตัวอักษร) แบ่งท่อนตามวรรคตอน/ประโยคเพื่อความเสถียร
    chunks = []
    current_chunk = []
    current_len = 0
    paragraphs = text.split("\n")
    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue
        if current_len + len(para_clean) + 1 > 2800 and current_chunk:
            chunks.append("\n".join(current_chunk))
            current_chunk = [para_clean]
            current_len = len(para_clean)
        else:
            current_chunk.append(para_clean)
            current_len += len(para_clean) + 1
    if current_chunk:
        chunks.append("\n".join(current_chunk))

    # รวม audio stream ของแต่ละ chunk เข้าด้วยกันอย่างต่อเนื่องแบบไร้รอยต่อ
    full_audio = io.BytesIO()
    for c in chunks:
        comm = edge_tts.Communicate(c, voice)
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                full_audio.write(chunk["data"])
    return full_audio.getvalue()

@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    """แปลงข้อความสังเคราะห์เสียง J.A.R.V.I.S. ด้วย Edge TTS Neural Voice (อ่านเนื้อหาทั้งหมดครบถ้วน 100%)"""
    raw_text = req.text.strip()
    if not raw_text:
        return JSONResponse({"error": "ไม่มีข้อความสำหรับสังเคราะห์เสียง"}, status_code=400)
    
    # ทำความสะอาด markdown syntax (เช่น **bold**, [Phase 1], etc.) ให้เสียงอ่านเป็นธรรมชาติ
    clean_text = clean_for_speech(raw_text)
    if not clean_text:
        clean_text = raw_text

    # กำหนดเพดานความปลอดภัยระดับสูงมาก (15,000 ตัวอักษร) เพื่อให้อ่านรายงานทุกยุทธการได้ครบถ้วน
    if len(clean_text) > 15000:
        clean_text = clean_text[:15000]
    
    voice = req.voice or "th-TH-NiwatNeural"
    
    try:
        audio_bytes = await generate_speech_audio(clean_text, voice)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Generation Error: {e}")
        return JSONResponse({"error": f"TTS synthesis failed: {str(e)}"}, status_code=500)


# ==================== TELEMETRY API ====================

@app.get("/api/telemetry")
def get_telemetry():
    """ดึงข้อมูล Telemetry ของระบบ Stark OS"""
    stats = db.get_dashboard_stats()
    uptime_seconds = int(time.time() - start_timestamp)
    
    return {
        "status": "NOMINAL",
        "core_efficiency": stats["completion_rate"],
        "active_directives": stats["total_goals"],
        "tactical_ops_total": stats["total_tasks"],
        "tactical_ops_completed": stats["completed_tasks"],
        "streak_days": stats["streak"],
        "uptime_seconds": uptime_seconds,
        "neural_link": "GEMINI-FLASH ACTIVE",
        "voice_module": "EDGE-TTS NIWAT READY"
    }


# ==================== DIRECTIVES / GOALS API ====================

class GoalRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "personal"
    target_date: Optional[str] = None

@app.get("/api/goals")
def list_goals():
    """ดึงยุทธการทั้งหมด"""
    goals = db.get_all_goals()
    return {"goals": goals}


@app.post("/api/goals")
def create_goal(req: GoalRequest):
    """สร้างยุทธการใหม่"""
    goal_id = db.create_goal(
        title=req.title,
        description=req.description,
        category=req.category,
        target_date=req.target_date
    )
    goal = db.get_goal(goal_id)
    return {"goal": goal}


@app.get("/api/goals/{goal_id}")
def get_goal(goal_id: int):
    """ดึงยุทธการเดี่ยว"""
    goal = db.get_goal(goal_id)
    if not goal:
        return JSONResponse({"error": "ไม่พบยุทธการ"}, status_code=404)
    return {"goal": goal}


@app.put("/api/goals/{goal_id}")
def update_goal(goal_id: int, req: GoalRequest):
    """อัพเดทยุทธการ"""
    db.update_goal(goal_id, title=req.title, description=req.description,
                   category=req.category, target_date=req.target_date)
    goal = db.get_goal(goal_id)
    return {"goal": goal}


@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: int):
    """ลบยุทธการ"""
    db.delete_goal(goal_id)
    javis_ai.refresh_context()
    return {"success": True}


# ==================== TACTICAL OPERATIONS / TASKS API ====================

class TaskRequest(BaseModel):
    goal_id: int
    title: str
    description: Optional[str] = ""
    frequency: Optional[str] = "one-time"
    due_date: Optional[str] = None

@app.post("/api/tasks")
def create_task(req: TaskRequest):
    """สร้างปฏิบัติการย่อยใหม่"""
    task_id = db.create_task(
        goal_id=req.goal_id,
        title=req.title,
        description=req.description,
        frequency=req.frequency,
        due_date=req.due_date
    )
    return {"task_id": task_id}


@app.put("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    """สลับสถานะปฏิบัติการ"""
    new_status = db.toggle_task(task_id)
    if new_status is None:
        return JSONResponse({"error": "ไม่พบปฏิบัติการ"}, status_code=404)
    return {"is_completed": bool(new_status)}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    """ลบปฏิบัติการ"""
    db.delete_task(task_id)
    return {"success": True}


@app.get("/api/tasks/today")
def today_tasks():
    """ดึงปฏิบัติการวันนี้"""
    tasks = db.get_today_tasks()
    return {"tasks": tasks}


# ==================== DASHBOARD API ====================

@app.get("/api/dashboard")
def dashboard():
    """ดึงข้อมูลสถานะ Mission Control"""
    stats = db.get_dashboard_stats()
    goals = db.get_all_goals()
    today = db.get_today_tasks()
    return {
        "stats": stats,
        "goals": [g for g in goals if g["status"] == "active"],
        "today_tasks": today
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
