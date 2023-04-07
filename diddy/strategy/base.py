from ..common import index_to_timestamp, DurationTuple
from ..sysk import SyskCtx
import IPython.display as ipd
import librosa
import math
import matplotlib.pyplot as plt
import numpy as np
import os
from typing import List


class BaseAsset:
    def __init__(self, ctx: SyskCtx, name: str):
        self.ctx = ctx
        self.name = name
        self.intervals: List[DurationTuple] = []

    def learning_artifact_filename(self, figname: str) -> str:
        return f'{self.ctx.learning_artifacts_dirname()}/learn-{self.name}/{figname}.png'

    def flush_diagram(self, fig_name: str) -> None:
        ctx = self.ctx
        plt.axis('off')
        filename = self.learning_artifact_filename(fig_name)
        dirname = os.path.dirname(filename)
        os.makedirs(dirname, exist_ok=True)
        plt.savefig(filename, bbox_inches='tight', pad_inches=0)
        plt.close()

    def intervals_to_melspectrograms(self,vis_mode: bool =True, flush: bool=True) -> None:
        print(f'\tgrammin\'')
        fig_names = []
        ctx = self.ctx
        for start, end, duration in self.intervals:
            slic = ctx.bytes[start:end]
            start_ms = math.floor(1000 * (start / ctx.sr))
            end_ms = math.floor(1000 * (end / ctx.sr))
            fig_name = f'melspectrogram_{start_ms}_ms_{end_ms}_ms_type_unknown'
            plt.figure(fig_name, dpi=50)
            plt.clf()
            sgram = librosa.stft(np.array(slic))
            sgram_mag, _ = librosa.magphase(sgram)
            mel_scale_sgram = librosa.feature.melspectrogram(
                S=sgram_mag, sr=ctx.sr)
            mel_sgram = librosa.amplitude_to_db(mel_scale_sgram, ref=np.min)
            librosa.display.specshow(mel_sgram, sr=ctx.sr,
                                     x_axis='time', y_axis='mel')
            if vis_mode:
                print(f'{index_to_timestamp(start + ctx.skipped_bytes, ctx.sr)}-{index_to_timestamp(end + ctx.skipped_bytes, ctx.sr)} ({duration:.2f}s)')
                ipd.display(ipd.Audio(slic, rate=ctx.sr)) # type: ignore[no-untyped-call]
                plt.show()
                print(f'---\n')
            fig_names.append(fig_name)
            if flush:
                self.flush_diagram(fig_name)
