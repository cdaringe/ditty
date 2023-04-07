import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import {
  Classification,
  parseSpectogramFilename,
} from "./util/classify-workflow";

export type Audio = {
  title: string;
  filename: string;
  melspectrogramsFilenames: string[];
};

const assetsDirname = path.resolve(__dirname, "../../../../assets");
const syskDirname = path.resolve(assetsDirname, "sysk-dl/data");

const getSyskMp3Filenames = async () => {
  const files = await fs.readdir(syskDirname);
  return files
    .filter((f) => f.endsWith("mp3"))
    .map((base) => path.join(syskDirname, base));
};

export const getLearnDirnameOfMp3Filename = (f: string) => {
  const assetDirname = path.dirname(f);
  const base = path.basename(f, ".mp3");
  return path.join(assetDirname, base, "learn-ws");
};

export const getSyskStream = (filename: string) => {
  if (!filename.includes("assets/sysk-dl/data")) {
    throw new Error("forbidden");
  }
  return createReadStream(filename);
};

export const renameClassify = async (
  filename: string,
  type: Classification
) => {
  if (!filename.includes("assets/sysk-dl/data")) {
    throw new Error("forbidden");
  }
  const nextFilename = filename.replace(/unknown/, type);
  await fs.rename(filename, nextFilename);
  console.log(`${filename} => ${nextFilename}`);
};

export const getSyskDittyCandidates = async () => {
  const mp3Filenames = await getSyskMp3Filenames();
  const audios: Audio[] = [];
  for (const mp3Filename of mp3Filenames) {
    const dirname = getLearnDirnameOfMp3Filename(mp3Filename);
    const isExists = await fs.stat(dirname).then(
      (stat) => stat.isDirectory(),
      (_err) => false
    );
    if (isExists) {
      const audio: Audio = {
        title: path.basename(mp3Filename, ".mp3"),
        filename: mp3Filename,
        melspectrogramsFilenames: await fs.readdir(dirname).then((filenames) =>
          filenames
            .filter((f) => f.endsWith("png"))
            .sort((a, b) => {
              const parsedA = parseSpectogramFilename(a);
              const parsedB = parseSpectogramFilename(b);
              return parsedA.start_ms - parsedB.start_ms;
            })
        ),
      };
      audios.push(audio);
    }
  }
  return audios;
};
