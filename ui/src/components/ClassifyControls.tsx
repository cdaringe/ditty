import { Audio } from "@/util";
import { Classification, isClassification } from "@/util/classify-workflow";
import React from "react";
import { MouseEventHandler } from "react";

type Props = {
  onClassify: (type: Classification) => void;
};

const allowed = ["content", "ad", "ditty"];

const style = {
  border: 0,
  borderRadius: 4,
  marginTop: 8,
  marginRight: 4,
  padding: "1rem",
  cursor: "pointer",
  width: "100%",
};

const adStyle = { ...style, backgroundColor: "red" };
const contentStyle = { ...style, backgroundColor: "blue" };
const dittyStyle = { ...style, backgroundColor: "green" };

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
    <div style={{ padding: "1rem" }}>
      <button style={contentStyle} onClick={onClick}>
        CONTENT
      </button>
      <br />
      <button style={adStyle} onClick={onClick}>
        AD
      </button>
      <br />
      <button style={dittyStyle} onClick={onClick}>
        DITTY
      </button>
    </div>
  );
};

export default ClassifyControls;
