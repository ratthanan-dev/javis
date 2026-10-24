"""
J.A.R.V.I.S. Multi-Key Manager & Load Balancer
Supports multiple API keys (comma-separated: key1, key2, key3) for Groq and Google Gemini.
Features:
- Automatic Round-Robin rotation & usage load balancing across working keys
- Live Health-Check & Validation with color status (🟢 active, 🟡 rate_limited, 🔴 invalid)
- Rate limit reset timing detection (1m, 1h, etc.)
- Automatic Pruning of invalid/expired keys
- Automatic Failover/Retry when a key encounters rate limits or errors
"""

import os
import re
import threading
import time
from typing import List, Tuple, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


def parse_keys_string(raw: Optional[str]) -> List[str]:
    """แยกคีย์จากข้อความ คั่นด้วยเครื่องหมายจุลภาค (,) หรือขึ้นบรรทัดใหม่"""
    if not raw:
        return []
    tokens = raw.replace("\n", ",").split(",")
    keys = []
    for t in tokens:
        cleaned = t.strip()
        if cleaned and cleaned not in keys:
            keys.append(cleaned)
    return keys


def mask_key(k: str) -> str:
    """Mask key สำหรับแสดงผลอย่างปลอดภัย"""
    if not k:
        return ""
    if len(k) <= 8:
        return "••••••••"
    return k[:4] + "••••••••" + k[-4:]


class KeyManager:
    def __init__(self):
        self._lock = threading.RLock()
        self.groq_keys: List[str] = []
        self.gemini_keys: List[str] = []
        self.groq_index: int = 0
        self.gemini_index: int = 0
        self.key_health: Dict[str, Dict[str, Any]] = {}
        self.usage_stats: Dict[str, int] = {}
        self.load_from_env()

    def load_from_env(self):
        """โหลดคีย์จาก .env และ environment variables"""
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        raw_groq = os.getenv("GROQ_API_KEY", "")
        raw_gemini = os.getenv("GEMINI_API_KEY", "")

        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    for line in f:
                        line_s = line.strip()
                        if line_s.startswith("GROQ_API_KEY="):
                            raw_groq = line_s.split("GROQ_API_KEY=", 1)[1]
                        elif line_s.startswith("GEMINI_API_KEY="):
                            raw_gemini = line_s.split("GEMINI_API_KEY=", 1)[1]
            except Exception as e:
                print(f"KeyManager: Error reading .env: {e}")

        with self._lock:
            self.groq_keys = parse_keys_string(raw_groq)
            self.gemini_keys = parse_keys_string(raw_gemini)
            self.groq_index = 0
            self.gemini_index = 0
            for k in self.groq_keys + self.gemini_keys:
                if k not in self.key_health:
                    self.key_health[k] = {"status": "active", "message": "พร้อมใช้งาน", "rate_limit_until": 0}
                if k not in self.usage_stats:
                    self.usage_stats[k] = 0

    def save_to_env(self, groq_keys: Optional[List[str]] = None, gemini_keys: Optional[List[str]] = None):
        """บันทึกคีย์ลงในไฟล์ .env และอัปเดต os.environ ทันที"""
        env_file = os.path.join(os.path.dirname(__file__), ".env")
        lines = []
        if os.path.exists(env_file):
            try:
                with open(env_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
            except Exception:
                pass

        new_groq_str = ", ".join(groq_keys) if groq_keys is not None else None
        new_gemini_str = ", ".join(gemini_keys) if gemini_keys is not None else None

        groq_found = False
        gemini_found = False
        new_lines = []

        for line in lines:
            if line.startswith("GROQ_API_KEY="):
                groq_found = True
                if new_groq_str is not None:
                    new_lines.append(f"GROQ_API_KEY={new_groq_str}\n")
                    os.environ["GROQ_API_KEY"] = new_groq_str
                else:
                    new_lines.append(line)
            elif line.startswith("GEMINI_API_KEY="):
                gemini_found = True
                if new_gemini_str is not None:
                    new_lines.append(f"GEMINI_API_KEY={new_gemini_str}\n")
                    os.environ["GEMINI_API_KEY"] = new_gemini_str
                else:
                    new_lines.append(line)
            else:
                new_lines.append(line)

        if not groq_found and new_groq_str is not None:
            new_lines.append(f"GROQ_API_KEY={new_groq_str}\n")
            os.environ["GROQ_API_KEY"] = new_groq_str

        if not gemini_found and new_gemini_str is not None:
            new_lines.append(f"GEMINI_API_KEY={new_gemini_str}\n")
            os.environ["GEMINI_API_KEY"] = new_gemini_str

        try:
            with open(env_file, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception as e:
            print(f"KeyManager: Error saving to .env: {e}")

        with self._lock:
            if groq_keys is not None:
                self.groq_keys = list(groq_keys)
                self.groq_index = 0
            if gemini_keys is not None:
                self.gemini_keys = list(gemini_keys)
                self.gemini_index = 0

    # ==================== ROTATION & LOAD BALANCING ====================

    def get_groq_key(self) -> Optional[str]:
        """หมุนเวียนดึงคีย์ Groq แบบ Round-Robin ข้ามคีย์ที่ติด rate limit ชั่วคราว"""
        now = time.time()
        with self._lock:
            if not self.groq_keys:
                return None
            
            # วนหาคีย์ที่ไม่ติด rate limit
            n = len(self.groq_keys)
            for _ in range(n):
                k = self.groq_keys[self.groq_index % n]
                self.groq_index = (self.groq_index + 1) % n
                health = self.key_health.get(k, {})
                if health.get("status") == "rate_limited":
                    if now >= health.get("rate_limit_until", 0):
                        health["status"] = "active"
                        health["message"] = "พ้นระยะ Rate Limit แล้ว"
                        self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
                        return k
                    continue  # ข้ามไปหาคีย์ถัดไป
                if health.get("status") != "invalid":
                    self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
                    return k
            
            # ถ้าติด rate limit ทุกคีย์ ให้ fallback ใช้คีย์แรกตามรอบ
            k = self.groq_keys[self.groq_index % n]
            self.groq_index = (self.groq_index + 1) % n
            self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
            return k

    def get_all_groq_keys(self) -> List[str]:
        with self._lock:
            return list(self.groq_keys)

    def get_gemini_key(self) -> Optional[str]:
        """หมุนเวียนดึงคีย์ Gemini แบบ Round-Robin"""
        now = time.time()
        with self._lock:
            if not self.gemini_keys:
                return None
            
            n = len(self.gemini_keys)
            for _ in range(n):
                k = self.gemini_keys[self.gemini_index % n]
                self.gemini_index = (self.gemini_index + 1) % n
                health = self.key_health.get(k, {})
                if health.get("status") == "rate_limited":
                    if now >= health.get("rate_limit_until", 0):
                        health["status"] = "active"
                        health["message"] = "พ้นระยะ Rate Limit แล้ว"
                        self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
                        return k
                    continue
                if health.get("status") != "invalid":
                    self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
                    return k

            k = self.gemini_keys[self.gemini_index % n]
            self.gemini_index = (self.gemini_index + 1) % n
            self.usage_stats[k] = self.usage_stats.get(k, 0) + 1
            return k

    def get_all_gemini_keys(self) -> List[str]:
        with self._lock:
            return list(self.gemini_keys)

    def mark_key_failed(self, provider: str, key: str, reason: str = ""):
        """บันทึกเมื่อคีย์ล้มเหลวขณะใช้งานพร้อมระบุสาเหตุ (Rate limit / Invalid)"""
        now = time.time()
        with self._lock:
            low_reason = reason.lower()
            if "429" in low_reason or "rate" in low_reason or "quota" in low_reason:
                # ตรวจหาระยะเวลา เช่น 1m, 60s, 5m, 1h
                duration = 60  # default 1 นาที
                time_match = re.search(r'try again in ([\d\.]+)(s|m|h)?', low_reason)
                reset_text = "ติด Rate Limit (รอประมาณ 1 นาที)"
                if time_match:
                    val = float(time_match.group(1))
                    unit = time_match.group(2) or "s"
                    if unit == "s":
                        duration = val
                        reset_text = f"ติด Rate Limit (รอ {int(val)} วินาที)"
                    elif unit == "m":
                        duration = val * 60
                        reset_text = f"ติด Rate Limit (รอ {int(val)} นาที)"
                    elif unit == "h":
                        duration = val * 3600
                        reset_text = f"ติด Rate Limit (รอ {int(val)} ชั่วโมง)"

                self.key_health[key] = {
                    "status": "rate_limited",
                    "message": reset_text,
                    "rate_limit_until": now + duration
                }
            elif "401" in low_reason or "invalid" in low_reason or "unauthenticated" in low_reason:
                self.key_health[key] = {
                    "status": "invalid",
                    "message": "คีย์ไม่ถูกต้อง หรือถูกระงับ (401)",
                    "rate_limit_until": 0
                }
                # ตัดออกจาก active pool
                if provider == "groq" and key in self.groq_keys:
                    self.groq_keys.remove(key)
                    self.save_to_env(groq_keys=self.groq_keys)
                elif provider == "gemini" and key in self.gemini_keys:
                    self.gemini_keys.remove(key)
                    self.save_to_env(gemini_keys=self.gemini_keys)

    # ==================== VALIDATION & PRUNING ====================

    @staticmethod
    def validate_groq_key(key: str) -> Tuple[str, str]:
        """
        ทดสอบ Groq API key คืนค่า (status, message):
        - status: 'active' (🟢), 'rate_limited' (🟡), 'invalid' (🔴)
        """
        if not key or not key.strip():
            return "invalid", "คีย์ว่างเปล่า"
        try:
            from groq import Groq
            client = Groq(api_key=key.strip(), timeout=5.0)
            models = client.models.list()
            return "active", f"เชื่อมต่อปกติ ({len(models.data)} โมเดลพร้อมใช้งาน)"
        except Exception as e:
            err = str(e)
            low_err = err.lower()
            if "401" in err or "invalid_api_key" in low_err or "unauthorized" in low_err:
                return "invalid", "คีย์ไม่ถูกต้องหรือถูกระงับ (401 Invalid Key)"
            if "429" in err or "rate" in low_err or "quota" in low_err:
                time_match = re.search(r'try again in ([\d\.]+)(s|m|h)?', low_err)
                if time_match:
                    val = time_match.group(1)
                    unit = time_match.group(2) or "s"
                    unit_th = "วินาที" if unit == "s" else ("นาที" if unit == "m" else "ชั่วโมง")
                    return "rate_limited", f"ติด Rate Limit (รอ {val} {unit_th})"
                return "rate_limited", "ติด Rate Limit ชั่วคราว (รอประมาณ 1 นาที)"
            return "invalid", f"ตรวจสอบไม่ผ่าน: {err[:60]}"

    @staticmethod
    def validate_gemini_key(key: str) -> Tuple[str, str]:
        """
        ทดสอบ Google Gemini API key คืนค่า (status, message):
        - status: 'active' (🟢), 'rate_limited' (🟡), 'invalid' (🔴)
        """
        if not key or not key.strip():
            return "invalid", "คีย์ว่างเปล่า"
        try:
            from google import genai
            client = genai.Client(api_key=key.strip(), http_options={"api_version": "v1beta"})
            client.models.get(model="gemini-2.5-flash")
            return "active", "เชื่อมต่อปกติ (Gemini 2.5 Flash Online)"
        except Exception as e:
            err = str(e)
            low_err = err.lower()
            if "401" in err or "unauthenticated" in low_err or "api key not valid" in low_err:
                return "invalid", "คีย์ไม่ถูกต้องหรือถูกเพิกถอน (401 Unauthenticated)"
            if "429" in err or "quota" in low_err:
                return "rate_limited", "ติด Quota/Rate Limit ชั่วคราว"
            return "invalid", f"ตรวจสอบไม่ผ่าน: {err[:60]}"

    def validate_and_prune_keys(
        self,
        raw_groq: Optional[str] = None,
        raw_gemini: Optional[str] = None,
        prune_invalid: bool = True
    ) -> Dict[str, Any]:
        """
        ตรวจสอบคีย์ทั้งหมด
        - 🟢 เขียว: ใช้งานได้
        - 🟡 เหลือง: ติด rate limit ชั่วคราว (ยังคงเก็บไว้ในระบบเพื่อรอ reset)
        - 🔴 แดง: คีย์เสีย/ถูกเพิกถอน (ตัดทิ้ง prune_invalid=True)
        """
        result = {
            "groq": {"active": [], "rate_limited": [], "pruned": []},
            "gemini": {"active": [], "rate_limited": [], "pruned": []},
            "message": ""
        }

        # 1. ตรวจสอบ Groq Keys
        groq_candidates = parse_keys_string(raw_groq) if raw_groq is not None else self.get_all_groq_keys()
        kept_groq = []
        for k in groq_candidates:
            status, reason = self.validate_groq_key(k)
            masked = mask_key(k)
            usage = self.usage_stats.get(k, 0)
            self.key_health[k] = {"status": status, "message": reason, "rate_limit_until": time.time() + 60 if status == "rate_limited" else 0}

            if status == "active":
                kept_groq.append(k)
                result["groq"]["active"].append({"masked": masked, "status": "active", "message": reason, "usage": usage})
            elif status == "rate_limited":
                kept_groq.append(k)
                result["groq"]["rate_limited"].append({"masked": masked, "status": "rate_limited", "message": reason, "usage": usage})
            else:
                if not prune_invalid:
                    kept_groq.append(k)
                result["groq"]["pruned"].append({"masked": masked, "status": "invalid", "message": reason, "usage": usage})

        # 2. ตรวจสอบ Gemini Keys
        gemini_candidates = parse_keys_string(raw_gemini) if raw_gemini is not None else self.get_all_gemini_keys()
        kept_gemini = []
        for k in gemini_candidates:
            status, reason = self.validate_gemini_key(k)
            masked = mask_key(k)
            usage = self.usage_stats.get(k, 0)
            self.key_health[k] = {"status": status, "message": reason, "rate_limit_until": time.time() + 60 if status == "rate_limited" else 0}

            if status == "active":
                kept_gemini.append(k)
                result["gemini"]["active"].append({"masked": masked, "status": "active", "message": reason, "usage": usage})
            elif status == "rate_limited":
                kept_gemini.append(k)
                result["gemini"]["rate_limited"].append({"masked": masked, "status": "rate_limited", "message": reason, "usage": usage})
            else:
                if not prune_invalid:
                    kept_gemini.append(k)
                result["gemini"]["pruned"].append({"masked": masked, "status": "invalid", "message": reason, "usage": usage})

        # บันทึกเฉพาะคีย์ที่เก็บไว้ลง .env
        self.save_to_env(
            groq_keys=kept_groq if raw_groq is not None or result["groq"]["pruned"] else None,
            gemini_keys=kept_gemini if raw_gemini is not None or result["gemini"]["pruned"] else None
        )

        groq_info = f"Groq: {len(result['groq']['active'])} คีย์พร้อมใช้งาน"
        if result['groq']['rate_limited']:
            groq_info += f", {len(result['groq']['rate_limited'])} คีย์ติด rate limit"
        if result['groq']['pruned']:
            groq_info += f", ตัดคีย์เสียทิ้ง {len(result['groq']['pruned'])} คีย์"

        gemini_info = f"Gemini: {len(result['gemini']['active'])} คีย์พร้อมใช้งาน"
        if result['gemini']['rate_limited']:
            gemini_info += f", {len(result['gemini']['rate_limited'])} คีย์ติด rate limit"
        if result['gemini']['pruned']:
            gemini_info += f", ตัดคีย์เสียทิ้ง {len(result['gemini']['pruned'])} คีย์"

        result["message"] = f"ผลการตรวจสอบ: {groq_info} | {gemini_info}"
        return result

    def get_status_summary(self) -> Dict[str, Any]:
        """ดึงสรุปสถานะคีย์ทั้งหมดสำหรับแสดงผลบน UI (สีเขียว, เหลือง, แดง พร้อมจำนวนการเรียกใช้)"""
        now = time.time()
        with self._lock:
            groq_keys = list(self.groq_keys)
            gemini_keys = list(self.gemini_keys)

        groq_details = []
        for i, k in enumerate(groq_keys):
            h = self.key_health.get(k, {})
            status = h.get("status", "active")
            msg = h.get("message", "พร้อมใช้งาน")
            if status == "rate_limited" and now >= h.get("rate_limit_until", 0):
                status = "active"
                msg = "พ้นระยะ Rate Limit แล้ว"
            groq_details.append({
                "index": i + 1,
                "masked": mask_key(k),
                "status": status,  # "active" (green), "rate_limited" (yellow), "invalid" (red)
                "message": msg,
                "usage": self.usage_stats.get(k, 0)
            })

        gemini_details = []
        for i, k in enumerate(gemini_keys):
            h = self.key_health.get(k, {})
            status = h.get("status", "active")
            msg = h.get("message", "พร้อมใช้งาน")
            if status == "rate_limited" and now >= h.get("rate_limit_until", 0):
                status = "active"
                msg = "พ้นระยะ Rate Limit แล้ว"
            gemini_details.append({
                "index": i + 1,
                "masked": mask_key(k),
                "status": status,
                "message": msg,
                "usage": self.usage_stats.get(k, 0)
            })

        return {
            "has_groq": len(groq_keys) > 0,
            "groq_count": len(groq_keys),
            "groq_keys": groq_details,
            "groq_raw": ", ".join(groq_keys),
            "has_gemini": len(gemini_keys) > 0,
            "gemini_count": len(gemini_keys),
            "gemini_keys": gemini_details,
            "gemini_raw": ", ".join(gemini_keys)
        }


# Global Singleton Instance
key_manager = KeyManager()
