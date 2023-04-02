import { renameClassify, getLearnDirnameOfMp3Filename } from "@/util";
import { isClassification } from "@/util/classify-workflow";
import assert from "assert";
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | {
        ok: true;
      }
    | {
        error: string;
      }
  >
) {
  try {
    const { mp3Filename, melBasename, classificationType } = req.query || {};
    const jsonQuery = JSON.stringify(req.query);
    assert(typeof mp3Filename === "string", jsonQuery);
    assert(typeof melBasename === "string", jsonQuery);
    assert(
      isClassification(classificationType),
      `bogus classification: ${classificationType}`
    );
    const dirname = getLearnDirnameOfMp3Filename(mp3Filename);
    const filename = path.resolve(dirname, melBasename);
    await renameClassify(filename, classificationType);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: String(err) });
  }
}
