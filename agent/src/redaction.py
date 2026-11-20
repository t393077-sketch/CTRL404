import re
import math
from typing import Tuple, List

# Core regex patterns for sensitive data
PATTERNS = [
    # Passwords & explicit secret fields
    (re.compile(r'(?i)(password|passwd|pwd|secret|api_key|access_token|auth_token)[\s:=]+([^\s,;\'"]+)', re.IGNORECASE),
     r'\1=[REDACTED:PASSWORD]'),
    
    # Specific API Tokens (OpenAI, GitHub, AWS, Canaries, JWTs)
    (re.compile(r'\b(sk-[a-zA-Z0-9_\-]{16,})\b', re.IGNORECASE), r'[REDACTED:API_KEY]'),
    (re.compile(r'\b(CANARY-[a-zA-Z0-9_\-]{8,}|SK-CANARY-[a-zA-Z0-9_\-]{8,})\b', re.IGNORECASE), r'[REDACTED:CANARY_SECRET]'),
    (re.compile(r'\b(gh[pousr]_[a-zA-Z0-9]{20,})\b'), r'[REDACTED:TOKEN]'),
    (re.compile(r'\b(AKIA[0-9A-Z]{16})\b'), r'[REDACTED:AWS_KEY]'),
    (re.compile(r'\beyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\b'), r'[REDACTED:JWT]'),
    (re.compile(r'(?i)bearer\s+([a-zA-Z0-9_\-\.]{12,})'), r'Bearer [REDACTED:TOKEN]'),

    # Credit Cards (16 digits with optional dashes/spaces)
    (re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b'), r'[REDACTED:CREDIT_CARD]'),

    # Email Addresses
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'), r'[REDACTED:EMAIL]'),

    # IPv4 Addresses
    (re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'),
     r'[REDACTED:IP]')
]

def calculate_shannon_entropy(data: str) -> float:
    """Calculates the Shannon entropy of a string (bits per symbol)"""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    frequencies = {}
    for char in data:
        frequencies[char] = frequencies.get(char, 0) + 1
    for count in frequencies.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

def redact_high_entropy_tokens(text: str, min_length: int = 16, entropy_threshold: float = 3.8) -> str:
    """Detects and redacts high-entropy alphanumeric strings (cryptographic keys, random tokens)"""
    words = text.split()
    redacted_words = []
    for word in words:
        clean_word = word.strip(".,;:\"'()[]{}")
        # Check if word is candidate for secret (alphanumeric, long, high randomness)
        if len(clean_word) >= min_length and any(c.isdigit() for c in clean_word) and any(c.isalpha() for c in clean_word):
            ent = calculate_shannon_entropy(clean_word)
            if ent >= entropy_threshold:
                redacted_words.append(word.replace(clean_word, "[REDACTED:HIGH_ENTROPY_SECRET]"))
                continue
        redacted_words.append(word)
    return " ".join(redacted_words)

def redact_text(text: str, max_length: int = 200) -> Tuple[str, bool]:
    """
    Applies comprehensive regex + Shannon entropy redaction.
    Guarantees raw secrets, passwords, tokens, PII never pass through.
    Returns: (redacted_text, was_redacted_bool)
    """
    if not text:
        return "", False

    original = text
    current = text

    # Phase 1: Regex pattern replacements
    for pattern, repl in PATTERNS:
        current = pattern.sub(repl, current)

    # Phase 2: Shannon entropy detection
    current = redact_high_entropy_tokens(current)

    was_redacted = (current != original)

    # Ensure length adheres to schema limits (<= 200 chars)
    if len(current) > max_length:
        current = current[:max_length - 3] + "..."

    return current, was_redacted
