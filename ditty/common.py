import librosa
import os
import math
import librosa
from typing import Any, Optional

DurationTuple = tuple[int, int, float]

def rm_ext(f: str) -> str:
    return os.path.splitext(f)[0]


def load_wav(f: str, sr: Optional[int]=16000) -> Any:
    return librosa.load(f, sr=sr)


def zero_pad_str(x: str, n: int) -> str:
    y = x
    while n > 0:
        n = n - 1
        y = "0" + y
    return y


def to_zero_padded_str(x: str, str_len: int=2) -> str:
    return zero_pad_str(x, str_len - len(x))


def index_to_timestamp(i: int, sr: int) -> str:
    s_dec = i / sr
    m = math.floor(s_dec / 60)
    s = math.ceil(s_dec - (m * 60))
    return f'{to_zero_padded_str(str(m))}:{to_zero_padded_str(str(s))}'


def is_similar_len(it: float, durset: set[float], threshold: float =0.01) -> bool:
    for duration in durset:
        if (abs(it - duration) / max(it, duration)) < threshold:
            return True
    return False


def dedupe_intervals(intervals: list[DurationTuple]) -> list[DurationTuple]:
    duration_set: set[float] = set()
    next_intervals = []
    for x in intervals:
        duration = x[2]
        if not is_similar_len(duration, duration_set):
            duration_set.add(duration)
            next_intervals.append(x)
    return next_intervals
    # return DotMap(intervals=next_intervals, duration_set=duration_set, skipped_count=len(intervals) - len(next_intervals))


def ltes(tup: DurationTuple, s: int) -> bool:
    return tup[2] <= s


def gtes(tup: DurationTuple, s: int) -> bool:
    return tup[2] >= s
