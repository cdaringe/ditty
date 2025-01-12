import argparse
import glob
from .sysk import SyskCtx
from .strategy.whitespace_split import StrategyWhiteSpaceSplitAsset
from .strategy.small_segment_split import StrategySmallSegment
import os


def get_config() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog='ditty',
        description='ditties, baby',
    )
    parser.add_argument('-m', '--mel', action='store_true')
    parser.add_argument('-s', '--shortseg', action='store_true')
    parser.add_argument('-f', '--files-glob')
    parser.add_argument('--sysk-files', action='store_true')

    args = parser.parse_args()
    print(args)
    if args.sysk_files:
        args.files_glob = f'{SyskCtx.sysk_dirname}/*.mp3'
    if args.mel and args.files_glob is None:
        raise BaseException("missing files_glob")
    return args


def main() -> None:
    config = get_config()
    files = glob.glob(config.files_glob) if config.files_glob else []
    for filename in files:
        print(f'processing file: {filename}')
        ctx = SyskCtx(filename)
        if config.mel:
            strat = StrategyWhiteSpaceSplitAsset(ctx)
            if os.path.exists(strat.learning_artifacts_dirname()):
                print(f'\t...artifacts exist, skipping')
            else:
                print(f'\tloading -> {strat.learning_artifacts_dirname()}')
                strat.split().filter().intervals_to_melspectrograms(vis_mode=False, flush=True)
        elif config.shortseg:
            strat_ss = StrategySmallSegment(ctx)
            if os.path.exists(strat_ss.learning_artifacts_dirname()):
                print(f'\t...artifacts exist, skipping')
            else:
                print(f'\tloading -> {strat_ss.learning_artifacts_dirname()}')
                strat_ss.split().intervals_to_melspectrograms(vis_mode=False, flush=True)

main()
