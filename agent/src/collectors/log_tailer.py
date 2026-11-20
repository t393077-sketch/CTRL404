import os
import re
import time
from collections import deque
from pathlib import Path
from typing import List, Dict, Any, Optional

FAILED_LOGIN_REGEX = re.compile(
    r'(?i)(failed password|authentication failure|login failed|invalid credentials|failed login|auth_fail)'
)

class LogTailer:
    def __init__(self, log_path: Path, window_seconds: float = 60.0, threshold: int = 5):
        self.log_path = Path(log_path)
        self.window_seconds = window_seconds
        self.threshold = threshold
        self.last_position = 0
        self.failure_timestamps = deque()
        self.last_alert_time = 0.0

        # Ensure parent directory and file exist
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.log_path.exists():
            self.log_path.touch()

    def process_new_lines(self) -> List[Dict[str, Any]]:
        """
        Tails the watched log file.
        Detects failed login bursts (>= 5 failures within 60s).
        Emits ONE summarized security event. Raw lines/secrets NEVER leave.
        """
        if not self.log_path.exists():
            return []

        now = time.time()
        new_failures = 0

        try:
            with open(self.log_path, "r", encoding="utf-8", errors="ignore") as f:
                f.seek(self.last_position)
                lines = f.readlines()
                self.last_position = f.tell()

            for line in lines:
                if FAILED_LOGIN_REGEX.search(line):
                    self.failure_timestamps.append(now)
                    new_failures += 1
        except Exception:
            return []

        # Prune timestamps older than window_seconds (60s)
        cutoff = now - self.window_seconds
        while self.failure_timestamps and self.failure_timestamps[0] < cutoff:
            self.failure_timestamps.popleft()

        count = len(self.failure_timestamps)
        events = []

        # Trigger summarized alert if threshold breached (rate limit alert output to once per 15s)
        if count >= self.threshold and (now - self.last_alert_time) > 15.0:
            self.last_alert_time = now
            severity = "critical" if count >= 10 else "warning"
            events.append({
                "metric": "security.failed_logins",
                "value": float(count),
                "category": "security",
                "severity": severity,
                # Summarized context only - zero raw secrets, passwords, or usernames
                "alert_context": f"{count} failed login attempts in 60s sliding window (rate breach)"
            })

        return events
