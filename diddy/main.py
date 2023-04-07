import argparse
import glob
from .sysk import SyskCtx
from .strategy.whitespace_split import StrategyWhiteSpaceSplitAsset
import os


def get_config() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog='ditty',
        description='ditties, baby',
    )
    parser.add_argument('-m', '--mel', action='store_true')
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
    if config.mel:
        for filename in files:
            print(f'processing file: {filename}')
            ctx = SyskCtx(filename)
            learning_artifacts_dirname = ctx.learning_artifacts_dirname()
            if os.path.exists(learning_artifacts_dirname):
                print(f'\t...artifacts exist, skipping')
            else:
                print(f'\tloading -> {learning_artifacts_dirname}')
                StrategyWhiteSpaceSplitAsset(ctx).split().filter().intervals_to_melspectrograms(vis_mode=False, flush=True)


main()
