from .common import rm_ext, load_wav
from typing import Optional, List
import os


def asset_filename(basename: str) -> str:
    return f"{SyskCtx.sysk_dirname}/{basename}"

class SyskCtx:

    sysk_dirname = "assets/sysk-dl/data"

    def __init__(self, filename: str, start_second: int =0, end_second: Optional[int] =None, sr: int=16000) -> None:
        self.end_second = end_second
        self.filename = filename
        self.skipped_bytes = 0
        self.sr = sr
        self.start_second = start_second
        self.title = rm_ext(os.path.basename(filename))
        self._wav_bytes: Optional[List[int]] = None

    def learning_artifacts_dirname(self) -> str:
        return f"{self.sysk_dirname}/{rm_ext(self.title)}"

    @property
    def bytes(self) -> List[int]:
        if self._wav_bytes is None:
            self.skipped_bytes = 0
            wav_bytes, sr = load_wav(self.filename, sr=self.sr)
            len_wav_bytes = len(wav_bytes)
            wav_bytes_start = self.start_second * sr
            wav_bytes_end = len_wav_bytes - \
                1 if self.end_second is None else self.end_second * sr
            self.skipped_bytes = wav_bytes_start
            if wav_bytes_start > 0 or self.end_second is not None:
                self._wav_bytes = wav_bytes[wav_bytes_start:wav_bytes_end]
            else:
                self._wav_bytes = wav_bytes
        return self._wav_bytes
