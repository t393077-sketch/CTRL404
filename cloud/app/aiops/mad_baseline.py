"""
Median Absolute Deviation (MAD) Dynamic Baseline Anomaly Detector.

Computes robust statistical baselines per (tenant_id, source_id, metric).
Unlike standard deviation, MAD is resilient to extreme outliers and skewed distributions.
"""

from typing import List, Dict, Any, Optional
import math


def calculate_median(values: List[float]) -> float:
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    n = len(sorted_vals)
    mid = n // 2
    if n % 2 == 1:
        return sorted_vals[mid]
    return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0


def calculate_mad(values: List[float], median: Optional[float] = None) -> float:
    if not values:
        return 0.0
    if median is None:
        median = calculate_median(values)
    abs_deviations = [abs(x - median) for x in values]
    return calculate_median(abs_deviations)


class MADBaselineDetector:
    """
    Maintains a rolling window of recent metric samples to evaluate whether
    a new incoming metric is a statistical anomaly beyond the dynamic baseline.
    """
    def __init__(self, window_size: int = 50, z_threshold: float = 3.0):
        self.window_size = window_size
        self.z_threshold = z_threshold
        # (tenant_id, source_id, metric) -> list of floats
        self._history: Dict[str, List[float]] = {}

    def _get_key(self, tenant_id: str, source_id: str, metric: str) -> str:
        return f"{tenant_id}::{source_id}::{metric}"

    def feed(self, tenant_id: str, source_id: str, metric: str, value: float) -> Dict[str, Any]:
        """
        Record value, compute MAD baseline, and return anomaly evaluation.
        """
        key = self._get_key(tenant_id, source_id, metric)
        if key not in self._history:
            self._history[key] = []
        
        hist = self._history[key]
        
        # Need at least 5 points to compute a meaningful baseline
        if len(hist) < 5:
            hist.append(value)
            if len(hist) > self.window_size:
                hist.pop(0)
            return {
                "is_anomaly": False,
                "metric": metric,
                "current_value": value,
                "baseline_median": value,
                "mad": 0.0,
                "modified_z_score": 0.0,
                "confidence": 0.5,
                "reason": "Calibrating baseline window"
            }

        median = calculate_median(hist)
        mad = calculate_mad(hist, median)

        # Append new value to history
        hist.append(value)
        if len(hist) > self.window_size:
            hist.pop(0)

        # Prevent division by zero if all values are identical
        if mad < 1e-4:
            # If MAD is near zero, evaluate absolute difference
            diff = abs(value - median)
            is_anomaly = diff > (0.15 * max(abs(median), 1.0))
            z_score = diff / (0.15 * max(abs(median), 1.0)) * 3.0 if is_anomaly else 0.0
        else:
            # Modified Z-Score: 0.6745 * (x - median) / MAD
            z_score = 0.6745 * abs(value - median) / mad
            is_anomaly = z_score >= self.z_threshold

        confidence = min(0.99, max(0.5, 1.0 - (1.0 / (1.0 + z_score))))

        reason = (
            f"Value {value:.2f} deviates from dynamic baseline median {median:.2f} "
            f"with modified Z-score {z_score:.2f} (threshold: {self.z_threshold})"
        ) if is_anomaly else "Metric operates within normal dynamic baseline"

        return {
            "is_anomaly": is_anomaly,
            "metric": metric,
            "current_value": value,
            "baseline_median": round(median, 2),
            "mad": round(mad, 2),
            "modified_z_score": round(z_score, 2),
            "confidence": round(confidence, 2),
            "reason": reason
        }

    def get_baseline_summary(self, tenant_id: str) -> List[Dict[str, Any]]:
        """Returns baseline state across all monitored metrics for this tenant."""
        summaries = []
        prefix = f"{tenant_id}::"
        for key, hist in self._history.items():
            if key.startswith(prefix):
                parts = key.split("::")
                source_id = parts[1]
                metric = parts[2]
                med = calculate_median(hist)
                mad = calculate_mad(hist, med)
                summaries.append({
                    "source_id": source_id,
                    "metric": metric,
                    "samples_count": len(hist),
                    "baseline_median": round(med, 2),
                    "mad": round(mad, 2),
                    "last_value": round(hist[-1], 2) if hist else 0.0
                })
        return summaries


# Global singleton instance
mad_detector = MADBaselineDetector(window_size=60, z_threshold=3.0)
