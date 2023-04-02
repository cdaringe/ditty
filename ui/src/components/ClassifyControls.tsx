import { Audio } from "@/util";
import {
  Classification,
  isClassification,
  parseSpectogramFilename,
} from "@/util/classify-workflow";
import React from "react";
import { MouseEventHandler } from "react";

type Props = {
  audio: Audio;
  melspectrogramFilename: string;
  onClassify: (type: Classification) => void;
};

const allowed = ["content", "ad", "ditty"];

const style = { marginTop: 4, marginRight: 4, padding: 4, cursor: "pointer" };

const ClassifyControls: React.FC<Props> = (props) => {
  const { onClassify } = props;
  const onClick: MouseEventHandler = React.useCallback(
    (evt) => {
      const type = evt.currentTarget.textContent?.toLowerCase();
      if (!type || !allowed.includes(type)) {
        throw new Error(`type ${type} unknown`);
      }
      if (isClassification(type)) {
        onClassify(type);
      } else {
        throw new Error(`bogus type: ${type}`);
      }
    },
    [onClassify]
  );
  return (
    <>
      <button style={style} onClick={onClick}>
        CONTENT
      </button>
      <br />
      <button style={style} onClick={onClick}>
        AD
      </button>
      <br />
      <button style={style} onClick={onClick}>
        DITTY
      </button>
    </>
  );
};

export default ClassifyControls;
