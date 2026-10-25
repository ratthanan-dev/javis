import sqlite3
import os
from datetime import datetime, date

DB_PATH = os.path.join(os.path.dirname(__file__), "javis.db")


def get_db():
    """สร้าง database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """สร้างตารางทั้งหมดถ้ายังไม่มี"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            category TEXT DEFAULT 'personal',
            target_date TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            frequency TEXT DEFAULT 'one-time',
            is_completed INTEGER DEFAULT 0,
            due_date TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS check_ins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            note TEXT DEFAULT '',
            completed_at TEXT DEFAULT (datetime('now', 'localtime')),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            updated_at TEXT DEFAULT (datetime('now', 'localtime'))
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT DEFAULT 'default',
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
    """)

    # Migration check: Ensure session_id column exists in chat_messages
    cursor.execute("PRAGMA table_info(chat_messages)")
    columns = [col[1] for col in cursor.fetchall()]
    if "session_id" not in columns:
        cursor.execute("ALTER TABLE chat_messages ADD COLUMN session_id TEXT DEFAULT 'default'")

    # Ensure default chat session exists
    cursor.execute("SELECT id FROM chat_sessions WHERE id = 'default'")
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES ('default', 'บทสนทนาหลัก', datetime('now', 'localtime'), datetime('now', 'localtime'))"
        )
    cursor.execute("UPDATE chat_messages SET session_id = 'default' WHERE session_id IS NULL OR session_id = ''")

    conn.commit()
    conn.close()


# ==================== GOALS ====================

def create_goal(title, description="", category="personal", target_date=None):
    """สร้างเป้าหมายใหม่"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO goals (title, description, category, target_date) VALUES (?, ?, ?, ?)",
        (title, description, category, target_date)
    )
    goal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return goal_id


def get_all_goals():
    """ดึงเป้าหมายทั้งหมด พร้อมข้อมูล tasks"""
    conn = get_db()
    goals = conn.execute("SELECT * FROM goals ORDER BY created_at DESC").fetchall()
    result = []
    for goal in goals:
        goal_dict = dict(goal)
        tasks = conn.execute(
            "SELECT * FROM tasks WHERE goal_id = ? ORDER BY created_at",
            (goal["id"],)
        ).fetchall()
        goal_dict["tasks"] = [dict(t) for t in tasks]
        total = len(goal_dict["tasks"])
        done = sum(1 for t in goal_dict["tasks"] if t["is_completed"])
        goal_dict["progress"] = int((done / total) * 100) if total > 0 else 0
        result.append(goal_dict)
    conn.close()
    return result


def get_goal(goal_id):
    """ดึงเป้าหมายเดียว"""
    conn = get_db()
    goal = conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if goal:
        goal_dict = dict(goal)
        tasks = conn.execute(
            "SELECT * FROM tasks WHERE goal_id = ? ORDER BY created_at",
            (goal_id,)
        ).fetchall()
        goal_dict["tasks"] = [dict(t) for t in tasks]
        total = len(goal_dict["tasks"])
        done = sum(1 for t in goal_dict["tasks"] if t["is_completed"])
        goal_dict["progress"] = int((done / total) * 100) if total > 0 else 0
        conn.close()
        return goal_dict
    conn.close()
    return None


def update_goal(goal_id, **kwargs):
    """อัพเดทเป้าหมาย"""
    conn = get_db()
    fields = []
    values = []
    for key, value in kwargs.items():
        if key in ("title", "description", "category", "target_date", "status"):
            fields.append(f"{key} = ?")
            values.append(value)
    if fields:
        fields.append("updated_at = datetime('now', 'localtime')")
        values.append(goal_id)
        conn.execute(
            f"UPDATE goals SET {', '.join(fields)} WHERE id = ?",
            values
        )
        conn.commit()
    conn.close()


def delete_goal(goal_id):
    """ลบเป้าหมาย"""
    conn = get_db()
    conn.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
    conn.commit()
    conn.close()


# ==================== TASKS ====================

def create_task(goal_id, title, description="", frequency="one-time", due_date=None):
    """สร้าง task ใหม่"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (goal_id, title, description, frequency, due_date) VALUES (?, ?, ?, ?, ?)",
        (goal_id, title, description, frequency, due_date)
    )
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id


def toggle_task(task_id):
    """สลับสถานะ task (เสร็จ/ยังไม่เสร็จ)"""
    conn = get_db()
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if task:
        new_status = 0 if task["is_completed"] else 1
        conn.execute(
            "UPDATE tasks SET is_completed = ? WHERE id = ?",
            (new_status, task_id)
        )
        # ถ้า check เสร็จ ให้สร้าง check-in ด้วย
        if new_status == 1:
            conn.execute(
                "INSERT INTO check_ins (task_id) VALUES (?)",
                (task_id,)
            )
        conn.commit()
    conn.close()
    return new_status if task else None


def delete_task(task_id):
    """ลบ task"""
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()


def get_today_tasks():
    """ดึง tasks ที่ต้องทำวันนี้ (daily tasks + tasks ที่ due วันนี้)"""
    conn = get_db()
    today = date.today().isoformat()
    tasks = conn.execute("""
        SELECT t.*, g.title as goal_title 
        FROM tasks t 
        JOIN goals g ON t.goal_id = g.id 
        WHERE g.status = 'active' 
        AND (t.frequency = 'daily' OR t.due_date = ?)
        ORDER BY t.is_completed, t.created_at
    """, (today,)).fetchall()
    conn.close()
    return [dict(t) for t in tasks]


# ==================== CHECK-INS ====================

def get_streak():
    """คำนวณ streak (จำนวนวันติดต่อกันที่ทำ task เสร็จ)"""
    conn = get_db()
    check_ins = conn.execute("""
        SELECT DISTINCT date(completed_at) as check_date
        FROM check_ins
        ORDER BY check_date DESC
    """).fetchall()
    conn.close()

    if not check_ins:
        return 0

    streak = 0
    today = date.today()
    for i, row in enumerate(check_ins):
        check_date = date.fromisoformat(row["check_date"])
        expected = today - __import__('datetime').timedelta(days=i)
        if check_date == expected:
            streak += 1
        else:
            break
    return streak


# ==================== CHAT & SESSIONS ====================

def create_chat_session(session_id: str, title: str = "บทสนทนาใหม่"):
    """สร้างห้องสนทนาใหม่"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
        (session_id, title)
    )
    conn.commit()
    conn.close()
    return {"id": session_id, "title": title}


def get_chat_sessions():
    """ดึงรายการห้องสนทนาทั้งหมด เรียงตามเวลาใช้งานล่าสุด พร้อมจำนวนข้อความ"""
    conn = get_db()
    sessions = conn.execute("""
        SELECT s.id, s.title, s.created_at, s.updated_at, COUNT(m.id) as message_count
        FROM chat_sessions s
        LEFT JOIN chat_messages m ON s.id = m.session_id
        GROUP BY s.id
        ORDER BY s.updated_at DESC
    """).fetchall()
    conn.close()
    return [dict(s) for s in sessions]


def search_chat_sessions(query: str):
    """ค้นหาห้องสนทนาและข้อความตามคำค้นหา (ค้นหาทั้งชื่อหัวข้อและเนื้อหาข้อความในแชท)"""
    if not query or not query.strip():
        return get_chat_sessions()
    
    q_clean = query.strip()
    q_wildcard = f"%{q_clean}%"
    conn = get_db()
    
    rows = conn.execute("""
        SELECT 
            s.id, 
            s.title, 
            s.created_at, 
            s.updated_at, 
            COUNT(m.id) as message_count,
            (
                SELECT m2.content 
                FROM chat_messages m2 
                WHERE m2.session_id = s.id AND m2.content LIKE ? 
                ORDER BY m2.id DESC 
                LIMIT 1
            ) as match_snippet
        FROM chat_sessions s
        LEFT JOIN chat_messages m ON s.id = m.session_id
        WHERE s.title LIKE ? OR s.id IN (
            SELECT DISTINCT session_id FROM chat_messages WHERE content LIKE ?
        )
        GROUP BY s.id
        ORDER BY s.updated_at DESC
    """, (q_wildcard, q_wildcard, q_wildcard)).fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        snippet = d.pop("match_snippet", None)
        if snippet:
            lower_snip = snippet.lower()
            lower_q = q_clean.lower()
            idx = lower_snip.find(lower_q)
            if idx != -1:
                start = max(0, idx - 20)
                end = min(len(snippet), idx + len(q_clean) + 30)
                prefix = "..." if start > 0 else ""
                suffix = "..." if end < len(snippet) else ""
                d["snippet"] = prefix + snippet[start:end].replace("\n", " ").strip() + suffix
            else:
                d["snippet"] = snippet[:50] + ("..." if len(snippet) > 50 else "")
        results.append(d)
        
    return results


def get_chat_session(session_id: str):
    """ดึงข้อมูลห้องสนทนาเดี่ยว"""
    conn = get_db()
    session = conn.execute("SELECT * FROM chat_sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return dict(session) if session else None


def update_chat_session_title(session_id: str, title: str):
    """อัปเดตหัวข้อการสนทนา"""
    conn = get_db()
    conn.execute(
        "UPDATE chat_sessions SET title = ?, updated_at = datetime('now', 'localtime') WHERE id = ?",
        (title.strip(), session_id)
    )
    conn.commit()
    conn.close()


def touch_chat_session(session_id: str):
    """อัปเดตเวลา updated_at ของห้องสนทนา"""
    conn = get_db()
    conn.execute(
        "UPDATE chat_sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?",
        (session_id,)
    )
    conn.commit()
    conn.close()


def delete_chat_session(session_id: str):
    """ลบห้องสนทนาและประวัติข้อความทั้งหมดในห้องนั้น"""
    conn = get_db()
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
    
    # ถ้าไม่มี session เหลืออยู่เลย ให้สร้าง default คืนมา
    remaining = conn.execute("SELECT COUNT(*) as count FROM chat_sessions").fetchone()["count"]
    if remaining == 0:
        conn.execute(
            "INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES ('default', 'บทสนทนาหลัก', datetime('now', 'localtime'), datetime('now', 'localtime'))"
        )
    conn.commit()
    conn.close()


def save_message(role: str, content: str, session_id: str = "default"):
    """บันทึกข้อความแชทระบุ session_id"""
    conn = get_db()
    
    # ตรวจสอบว่า session มีอยู่จริงหรือไม่ ถ้าไม่มีให้สร้างอัตโนมัติ
    existing = conn.execute("SELECT id FROM chat_sessions WHERE id = ?", (session_id,)).fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))",
            (session_id, "บทสนทนาใหม่")
        )
    else:
        conn.execute(
            "UPDATE chat_sessions SET updated_at = datetime('now', 'localtime') WHERE id = ?",
            (session_id,)
        )
        
    conn.execute(
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content)
    )
    conn.commit()
    conn.close()


def get_chat_history(session_id: str = "default", limit: int = 50):
    """ดึงประวัติแชทตาม session_id"""
    conn = get_db()
    messages = conn.execute(
        "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
        (session_id, limit)
    ).fetchall()
    conn.close()
    return [dict(m) for m in reversed(messages)]


def clear_chat_history(session_id: str = "default"):
    """ล้างประวัติแชทเฉพาะห้องที่ระบุ"""
    conn = get_db()
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()


def clear_completed_tasks():
    """ลบ tasks ที่เสร็จแล้วออกจากระบบ"""
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE is_completed = 1")
    conn.commit()
    conn.close()


def clear_all_history():
    """ล้างประวัติการสื่อสารทั้งหมดทุกห้อง"""
    conn = get_db()
    conn.execute("DELETE FROM chat_messages")
    conn.commit()
    conn.close()


# ==================== DASHBOARD ====================

def get_dashboard_stats():
    """ดึงสถิติสำหรับ Dashboard"""
    conn = get_db()
    
    total_goals = conn.execute(
        "SELECT COUNT(*) as count FROM goals WHERE status = 'active'"
    ).fetchone()["count"]
    
    total_tasks = conn.execute(
        "SELECT COUNT(*) as count FROM tasks t JOIN goals g ON t.goal_id = g.id WHERE g.status = 'active'"
    ).fetchone()["count"]
    
    completed_tasks = conn.execute(
        "SELECT COUNT(*) as count FROM tasks t JOIN goals g ON t.goal_id = g.id WHERE g.status = 'active' AND t.is_completed = 1"
    ).fetchone()["count"]
    
    conn.close()
    
    streak = get_streak()
    completion_rate = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    
    return {
        "total_goals": total_goals,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "streak": streak,
        "completion_rate": completion_rate
    }


def get_tactical_briefing_data():
    """ดึงข้อมูลเชิงยุทธวิธีสำหรับ Daily Tactical Briefing"""
    stats = get_dashboard_stats()
    goals = [g for g in get_all_goals() if g["status"] == "active"]
    today_tasks = get_today_tasks()
    
    pending_today = [t for t in today_tasks if not t["is_completed"]]
    completed_today = [t for t in today_tasks if t["is_completed"]]
    
    return {
        "stats": stats,
        "active_goals": goals,
        "today_tasks": today_tasks,
        "pending_today_count": len(pending_today),
        "completed_today_count": len(completed_today),
        "streak": stats["streak"]
    }

