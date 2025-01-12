from ..common import ltes, gtes, dedupe_intervals, DurationTuple
from ..strategy.base import BaseAsset
from typing import Optional, List
from typing_extensions import Self
from ..sysk import SyskCtx
import librosa
import numpy as np
import math

class StrategySmallSegment(BaseAsset):
    def __init__(self, ctx: SyskCtx):
        super(StrategySmallSegment, self).__init__(ctx, "small-segment")
        self.overlap_len_s = 2
        self.overlap_samples_len = self.overlap_len_s * self.ctx.sr
        self.small_segment_length_s = 5

    def split(self) -> Self:
        print(f'\tsplitting')
        if len(self.intervals) > 0:
            raise BaseException("already split!")
        num_samples_per_segment = self.ctx.sr * self.small_segment_length_s
        final_index = len(self.ctx.bytes)
        self.intervals: List[DurationTuple] = []
        start = 0
        while start <= final_index:
          end = start + num_samples_per_segment
          self.intervals.append((start, end, self.small_segment_length_s))
          start = (end - self.overlap_samples_len) + 1

        return self
