import type { NextApiRequest, NextApiResponse } from "next";
import { getSyskStream } from "../../util";
type Data = Buffer;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const stream = getSyskStream((req.query?.filename as string) || "_");
    return res.status(200).send(stream as any);
  } catch (err) {
    return res
      .status(400)
      .setHeader("x-o-error", String(err))
      .send(Buffer.from(""));
  }
}
