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

        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
    """)

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


# ==================== CHAT ====================

def save_message(role, content):
    """บันทึกข้อความแชท"""
    conn = get_db()
    conn.execute(
        "INSERT INTO chat_messages (role, content) VALUES (?, ?)",
        (role, content)
    )
    conn.commit()
    conn.close()


def get_chat_history(limit=50):
    """ดึงประวัติแชท"""
    conn = get_db()
    messages = conn.execute(
        "SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(m) for m in reversed(messages)]


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

