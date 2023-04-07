import { Audio } from "@/util";
import React from "react";

const CLASSIFICATION_UNKNOWN = "unknown";
const CLASSIFICATION_AD = "ad";
const CLASSIFICATION_DITTY = "ditty";
const CLASSIFICATION_CONTENT = "content";

const classifications = [
  CLASSIFICATION_UNKNOWN,
  CLASSIFICATION_AD,
  CLASSIFICATION_DITTY,
  CLASSIFICATION_CONTENT,
] as const;

export type Classification =
  | typeof CLASSIFICATION_UNKNOWN
  | typeof CLASSIFICATION_AD
  | typeof CLASSIFICATION_DITTY
  | typeof CLASSIFICATION_CONTENT;

export function isClassification(x: unknown): x is Classification {
  if (classifications.includes(x as any)) return true;
  return false;
}

export const useGetNextMel = ({
  audio,
  isShowingClassified = false,
}: {
  audio: Audio[];
  isShowingClassified?: boolean;
}) => {
  const iterMels = React.useMemo(() => {
    !!isShowingClassified; // break cache
    return getMels(audio);
  }, [audio, isShowingClassified]);
  const getNextMel = React.useCallback(() => {
    for (const audio of iterMels) {
      const specto = parseSpectogramFilename(
        audio.audio.melspectrogramsFilenames[audio.melIndex]
      );
      if (isShowingClassified || specto.classification === "unknown") {
        return audio;
      }
      console.debug(
        `skipping ${specto.classification} (${audio.audioIndex}) [${audio.melIndex}]`
      );
    }
    return null;
  }, [iterMels, isShowingClassified]);
  return getNextMel;
};

export const parseSpectogramFilename = (basename: string) => {
  // melspectrogram_1099872_1117792_type_ttt.png
  const [_melspec, start_raw, _ms, end_raw, __ms, _type, classification] =
    basename.replace(".png", "").split("_");
  const [start_ms, end_ms] = [start_raw, end_raw].map((x) => {
    const i = parseInt(x, 10);
    if (Number.isInteger(i)) {
      return i;
    }
    throw new Error(`${x} is not an int (${basename})`);
  }) as [number, number];
  if (isClassification(classification)) {
    return {
      start_ms,
      end_ms,
      duration_ms: end_ms - start_ms,
      classification,
      basename,
    };
  }
  throw new Error(`unable to parse mel filename: ${f}`);
};

export type MelMeta = ReturnType<typeof parseSpectogramFilename>;

export type AudioState = {
  audio: Audio;
  audioIndex: number;
  melIndex: number;
};

type MelIter = Iterable<AudioState> & IterableIterator<AudioState>;

export const getMels: (source: Audio[]) => MelIter = (src) => {
  let audioIndex = -1;
  let melIndex = -1;
  let currAudio: Audio | null = null;
  let currMel: string | null = null;
  return {
    next() {
      if (!currAudio) {
        ++audioIndex;
        currAudio = src[audioIndex];
      }
      if (!currAudio) {
        return { done: true, value: undefined };
      }
      ++melIndex;
      currMel = currAudio.melspectrogramsFilenames[melIndex] || null;
      if (currMel === null) {
        melIndex = -1;
        currAudio = null;
        return this.next();
      }

      return {
        done: false,
        value: {
          audio: currAudio,
          audioIndex,
          melIndex,
        },
      };
    },
    [Symbol.iterator]() {
      return this;
    },
  };
};
