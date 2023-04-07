import Head from "next/head";
import { GetServerSideProps, NextPage } from "next";
import { Audio, getSyskDittyCandidates } from "@/util";
import React from "react";
import H5AudioPlayer from "react-h5-audio-player";
import ClassifyControls from "@/components/ClassifyControls";
import {
  Classification,
  MelMeta,
  parseSpectogramFilename,
} from "@/util/classify-workflow";

type Props = {
  audio: Audio[];
};

function filenameToMp3Url(filename: string) {
  const url = new URL(window.location.href);
  url.pathname = "/api/sysk-mp3";
  url.searchParams.append("filename", filename);
  return url.toString();
}

function toClassifiedAudioUrl(mp3Filename: string, mel: MelMeta, type: string) {
  const url = new URL(window.location.href);
  url.pathname = "/api/sysk-classify";
  url.searchParams.append("mp3Filename", mp3Filename);
  url.searchParams.append("melBasename", mel.basename);
  url.searchParams.append("classificationType", type);
  return url.toString();
}

const Home: NextPage<Props> = (props) => {
  const [isShowingClassified, setShowClassified] = React.useState(false);
  const lastPlayTimeout = React.useRef(-1);
  const [melIndex, setMelIndex] = React.useState(0);
  const [player, setPlayer] = React.useState<null | H5AudioPlayer>(null);
  const [playerAudio, setPlayerAudio] = React.useState<null | HTMLAudioElement>(
    null
  );
  const [selectedAudio, setSelectedAudio] = React.useState<null | Audio>(null);
  const mels = React.useMemo(() => {
    const nextMels =
      selectedAudio?.melspectrogramsFilenames.map((f) =>
        parseSpectogramFilename(f)
      ) || [];
    setMelIndex(0);
    return nextMels.filter((m) =>
      isShowingClassified ? true : m.classification === "unknown"
    );
  }, [selectedAudio, isShowingClassified]);

  const mel = mels[melIndex];
  const onPlay = React.useCallback(() => {
    if (!mel) return;
    if (playerAudio) playerAudio.currentTime = mel.start_ms / 1000;
    window.clearTimeout(lastPlayTimeout.current);
    lastPlayTimeout.current = window.setTimeout(() => {
      playerAudio?.pause();
    }, mel.duration_ms);
    console.debug(`playing ${lastPlayTimeout.current}`);
  }, [mel, playerAudio]);
  React.useEffect(
    function pollForAudioEl() {
      if (!player) return;
      const intv = setInterval(() => {
        if (player.audio.current) {
          setPlayerAudio(player.audio.current);
          clearInterval(intv);
        }
      }, 20);
    },
    [player]
  );
  React.useEffect(
    function setStartTime() {
      if (!mel || !playerAudio) {
        return;
      }
      playerAudio.currentTime = mel.start_ms / 1000;
      playerAudio.autoplay = true;
      playerAudio.play();
      onPlay();
    },
    [mel, playerAudio, onPlay]
  );
  const onClassify = React.useCallback(
    (type: Classification) => {
      if (!selectedAudio || !mel) throw new Error("biff city");
      fetch(toClassifiedAudioUrl(selectedAudio.filename, mel, type))
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res;
        })
        .then(() => {
          mel.classification = type;
          setMelIndex((last) => last + 1);
        });
    },
    [selectedAudio, mel]
  );
  React.useEffect(
    function initFirstAudio() {
      const firstAudio = props.audio[0];
      if (firstAudio) setSelectedAudio(firstAudio);
    },
    [props.audio]
  );
  const [audioSrc, setAudioSrc] = React.useState<null | string>(null);
  React.useEffect(
    function loadAudio() {
      if (!selectedAudio) return;
      const nextAudioSrcUrl = filenameToMp3Url(selectedAudio.filename);
      fetch(nextAudioSrcUrl)
        .then((r) => r.blob())
        .then((blob) => {
          setAudioSrc(URL.createObjectURL(blob));
        });
    },
    [selectedAudio]
  );
  React.useEffect(
    function dropPlayerReferenceOnMount() {
      if (!mel) {
        // allow playerAudio to GC and halt playing
        // this condition must be sync'd with the player render/mount
        // conditions :|
        console.debug(`purging playerAudio`);
        setPlayerAudio(null);
      }
    },
    [audioSrc, mel]
  );
  return (
    <>
      <Head>
        <title>ditty time</title>
        <meta name="description" content="dit skittin boogie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={""}>
        <select
          onChange={(evt) => {
            const i = parseInt(evt.currentTarget.value, 10);
            const nextAudio = props.audio[i]!;
            setSelectedAudio(nextAudio);
          }}
        >
          {props.audio.map((a, i) => {
            const isClassified = !a.melspectrogramsFilenames.find((f) =>
              f.match(/_unknown/)
            );
            return (
              <option key={i} value={i}>
                {a.title} - {isClassified ? "classified" : "unclassified"}
              </option>
            );
          })}
        </select>
        {selectedAudio && playerAudio ? (
          <dl>
            <dt>Title</dt>
            <dd>{selectedAudio.title}</dd>
            <dt># melspectagrams (rem)</dt>
            <dd>{mels.length}</dd>
            {mel
              ? (function ParsedFields() {
                  const { start_ms, end_ms, duration_ms } = mel;
                  const startS = start_ms / 1000;
                  const endS = end_ms / 1000;
                  const durationS = duration_ms / 1000;
                  // const clipPercCompleted =
                  //   (playerAudio.currentTime - startS) / durationS;
                  // const clipPercentVis = `[${[...new Array(100)].map((_, i) =>
                  //   i / 100 < clipPercCompleted ? "=" : ""
                  // )}] (${clipPercCompleted.toFixed(1)}%)`;
                  return (
                    <>
                      <dt>Range</dt>
                      <dd>
                        {startS} - {endS} ({durationS.toFixed(1)}s)
                      </dd>
                      <dt>Classification</dt>
                      <dd>{mel.classification}</dd>

                      {/* <dt>Clip Progress</dt>
                      <dd>{clipPercentVis}</dd> */}

                      <dt>MelDump</dt>
                      <dd>
                        {/* {melIndex} of {mels.length} */}
                        <pre>{JSON.stringify(mel, null, 2)}</pre>
                      </dd>
                    </>
                  );
                })()
              : null}
          </dl>
        ) : (
          <h3>All content classified</h3>
        )}
        <input
          name="show_classified"
          type="checkbox"
          onClick={(_) => setShowClassified(!isShowingClassified)}
        />
        <label htmlFor="show_classified" defaultChecked={isShowingClassified}>
          Show classified?
        </label>
        {audioSrc && mel ? (
          <>
            <H5AudioPlayer
              autoPlay
              showSkipControls
              showJumpControls={false}
              ref={(player) => {
                // if (player) {
                setPlayer(player);
                // } else {
                // console.warn(`no player?`);
                // }
              }}
              src={audioSrc}
              showDownloadProgress
              showFilledProgress
              onClickNext={() => {
                window.clearTimeout(lastPlayTimeout.current);
                setMelIndex((i) => i + 1);
              }}
              onClickPrevious={() => {
                window.clearTimeout(lastPlayTimeout.current);
                setMelIndex((i) => (i > 0 ? i - 1 : 0));
              }}
              onPlay={(_) => {
                onPlay();
              }}
              onError={console.error}
              onPlayError={console.error}
            />
            <ClassifyControls onClassify={onClassify} />
          </>
        ) : null}
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const audio = await getSyskDittyCandidates();
  return {
    props: {
      audio,
    },
  };
};

export default Home;
