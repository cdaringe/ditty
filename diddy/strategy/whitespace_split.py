from ..common import ltes, gtes, dedupe_intervals, DurationTuple
from ..strategy.base import BaseAsset
from typing import Optional, List
from typing_extensions import Self
from ..sysk import SyskCtx
import librosa
import numpy as np

class StrategyWhiteSpaceSplitAsset(BaseAsset):
    def __init__(self, ctx: SyskCtx):
        super(StrategyWhiteSpaceSplitAsset, self).__init__(ctx, "ws")

    def split(self) -> Self:
        print(f'\tsplitting')
        if len(self.intervals) > 0:
            raise BaseException("already split!")
        intervals_raw = librosa.effects.split(np.array(self.ctx.bytes))
        intervals = []
        raw_start_idx = intervals_raw[0][0]
        is_zero_start = raw_start_idx == 0
        if not is_zero_start:
            intervals.append([0, raw_start_idx - 1])
        for x in intervals_raw:
            intervals.append(list(x))
        self.intervals = [(x, y, (y - x) / self.ctx.sr)
                          for (x, y) in intervals]
        return self

    def _satisifies_ditty_rules(self, tup: DurationTuple) -> bool:
        return ltes(tup, 25) and gtes(tup, 5)

    def filter(self) -> Self:
        print(f'\tfiltering')
        self.intervals = [x for x in filter(
            self._satisifies_ditty_rules, self.intervals)]
        self.intervals = dedupe_intervals(self.intervals)
        return self
