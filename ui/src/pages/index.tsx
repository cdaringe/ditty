import Head from "next/head";
import { GetServerSideProps, NextPage } from "next";
import { Audio, getSyskDittyCandidates } from "@/util";
import React from "react";
import H5AudioPlayer from "react-h5-audio-player";
import ClassifyControls from "@/components/ClassifyControls";
import {
  AudioState,
  Classification,
  parseSpectogramFilename,
  useGetNextMel,
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

function toClassifiedAudioUrl(
  mp3Filename: string,
  melBasename: string,
  type: string
) {
  const url = new URL(window.location.href);
  url.pathname = "/api/sysk-classify";
  url.searchParams.append("mp3Filename", mp3Filename);
  url.searchParams.append("melBasename", melBasename);
  url.searchParams.append("classificationType", type);
  return url.toString();
}

const Home: NextPage<Props> = (props) => {
  const [isShowingClassified, setShowClassified] = React.useState(false);
  const [player, setPlayer] = React.useState<null | H5AudioPlayer>(null);
  const [playerAudio, setPlayerAudio] = React.useState<null | HTMLAudioElement>(
    null
  );
  const [audioSrcUrl, setAudioSrcUrl] = React.useState<null | string>(null);
  const getNextMel = useGetNextMel({ audio: props.audio, isShowingClassified });
  const [selectedAudio, setSelectedAudio] = React.useState<null | AudioState>(
    null
  );
  const melspectrogramFilename =
    selectedAudio?.audio.melspectrogramsFilenames[selectedAudio.melIndex];
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
    function initFirstClip() {
      setSelectedAudio(getNextMel());
    },
    [getNextMel]
  );
  React.useEffect(
    function setStartTime() {
      if (!selectedAudio || !playerAudio) {
        return;
      }
      if (playerAudio && selectedAudio) {
        const mel =
          selectedAudio.audio.melspectrogramsFilenames[selectedAudio.melIndex];
        const parsed = parseSpectogramFilename(mel);
        playerAudio.currentTime = parsed.start_ms / 1000;
        playerAudio.autoplay = true;
        console.log(`indexing audio to mel ${playerAudio.currentTime}`);
      }
    },
    [selectedAudio, playerAudio]
  );
  const onClassify = React.useCallback(
    (type: Classification) => {
      if (!selectedAudio) throw new Error("biff city");
      fetch(
        toClassifiedAudioUrl(
          selectedAudio.audio.filename,
          selectedAudio.audio.melspectrogramsFilenames[selectedAudio.melIndex],
          type
        )
      )
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res;
        })
        .then(() => {
          const nextMel = getNextMel();
          if (nextMel) {
            const fileparts = nextMel.audio.filename.split("/");
            const base = fileparts[fileparts.length - 1];
            console.info(
              `${base.substr(-50, 50)}..., [${nextMel.melIndex + 1}/${
                nextMel.audio.melspectrogramsFilenames.length
              }]`
            );
          }
          setSelectedAudio(nextMel);
        });
    },
    [selectedAudio, getNextMel]
  );
  React.useEffect(
    function initFirstUrl() {
      if (selectedAudio)
        setAudioSrcUrl(filenameToMp3Url(selectedAudio.audio.filename));
    },
    [selectedAudio]
  );
  const audioSrcUrlRef = React.useRef("");
  audioSrcUrlRef.current = audioSrcUrl || "";
  const [audioSrc, setAudioSrc] = React.useState<null | string>(null);
  React.useEffect(() => {
    if (!audioSrcUrl) return;
    fetch(audioSrcUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const a = audioSrcUrl;
        const b = audioSrcUrlRef.current;
        if (a !== b) {
          console.warn(`URL changed, ignoring [${a}, ${b}]`);
          return;
        }
        setAudioSrc(URL.createObjectURL(blob));
      });
  }, [audioSrcUrl]);
  return (
    <>
      <Head>
        <title>ditty time</title>
        <meta name="description" content="dit skittin boogie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={""}>
        {selectedAudio ? (
          <dl>
            <dt>Title</dt>
            <dd>{selectedAudio.audio.title}</dd>
            <dt>#-melspectagrams</dt>
            <dd>{selectedAudio.audio.melspectrogramsFilenames.length}</dd>
            {melspectrogramFilename
              ? (function ParsedFields() {
                  const parsed = parseSpectogramFilename(
                    melspectrogramFilename
                  );
                  const startS = parsed.start_ms / 1000;
                  const endS = parsed.end_ms / 1000;
                  const durationS = endS - startS;
                  return (
                    <>
                      <dt>Range</dt>
                      <dd>
                        {startS} - {endS} ({durationS.toFixed(1)}s)
                      </dd>
                      <dt>Classification</dt>
                      <dd>{parsed.classification}</dd>
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
        {audioSrc && selectedAudio && melspectrogramFilename ? (
          <>
            <H5AudioPlayer
              autoPlay
              ref={(player) => {
                if (player) {
                  console.log("player found");
                  setPlayer(player);
                } else {
                  console.warn(`wtf no player?`);
                }
              }}
              src={audioSrc}
              showDownloadProgress
              showFilledProgress
              onClickNext={(evt) => {
                console.log(evt);
              }}
              onError={console.error}
              onPlayError={console.error}
            />
            <ClassifyControls
              audio={selectedAudio.audio}
              melspectrogramFilename={melspectrogramFilename}
              onClassify={onClassify}
            />
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
