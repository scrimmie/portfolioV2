import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PiVinylRecordThin } from "react-icons/pi";

interface SpotifyResponse {
  isPlaying: boolean;
  currentTrack?: Track;
  currentTrackProgress?: number;
}
interface Track {
  album: {
    album_type: string;
    total_tracks: number;
    available_markets: Array<string>;
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    name: string;
    release_date: string;
    release_date_precision: string;
    restrictions: {
      reason: string;
    };
    type: string;
    uri: string;
    artists: Array<{
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }>;
  };
  artists: Array<{
    external_urls: {
      spotify: string;
    };
    followers: {
      href: string;
      total: number;
    };
    genres: Array<string>;
    href: string;
    id: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    name: string;
    popularity: number;
    type: string;
    uri: string;
  }>;
  available_markets: Array<string>;
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc: string;
    ean: string;
    upc: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_playable: boolean;
  linked_from: {};
  restrictions: {
    reason: string;
  };
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: string;
  uri: string;
  is_local: boolean;
}
export default function Player() {
  const [track, setTrack] = useState<Track>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState<number>();
  const [duration, setDuration] = useState<number>();
  useEffect(() => {
    async function get() {
      if (isPlaying === false) {
        const r = await fetch(
          "https://spotify-worker.dapice.dev/currentTrack",
          {
            headers: {
              Authorization: `Basic dGVzdFNwb3RpZnk6UG9ydGZvbGlvU2l0ZQ==`,
            },
          }
        );
        if (r.status === 200) {
          const body = (await r.json()) as SpotifyResponse;
          if (body.isPlaying) {
            setIsPlaying(body.isPlaying);
            setTrack(body.currentTrack);
            setTrackProgress(Math.round(body.currentTrackProgress! / 1000));
          }
        }
      }
    }
    get();
  }, [isPlaying]);

  useEffect(() => {
    if (track && trackProgress) {
      setDuration(
        // add a 5 second delay to ensure spotify has transitioned to next song
        Math.round(Math.round(track?.duration_ms / 1000) - trackProgress) + 5
      );
    }
  }, [trackProgress]);

  return (
    <AnimatePresence>
      <div className="flex w-full h-full items-center justify-center flex-col">
        {isPlaying && track && duration && trackProgress ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01],
            }}
            className="h-full w-full flex flex-col justify-center items-center"
          >
            <h1 className="text-white font-JetbrainsMono text-lg px-12 text-center">
              What am I currently listening to ...
            </h1>

            <motion.img
              className="px-12 pt-12 pb-6"
              src={track.album.images[0].url}
            />
            <a
              className="text-white font-JetbrainsMono text-lg hover:text-purple-600 px-5 text-center"
              href={track.external_urls.spotify}
              target="_blank"
            >
              {track.name}
            </a>
            <h2 className="text-white font-JetbrainsMono text-sm px-5 text-center">
              {track.album.name}
            </h2>
            <h2 className="text-white font-JetbrainsMono text-sm px-5 text-center">
              {track.artists[0].name}
            </h2>
            <div className="w-full px-10 mt-5">
              <div className="h-4 w-full bg-neutral-200 rounded-lg">
                <motion.div
                  initial={{
                    width:
                      Math.round(
                        (trackProgress! /
                          Math.round(track.duration_ms / 1000)) *
                          100
                      ) + "%",
                  }}
                  animate={{ width: "100%" }}
                  transition={{ duration: duration, ease: "linear" }}
                  className="h-4 bg-purple-600 rounded-lg"
                  onAnimationComplete={() => {
                    setDuration(undefined);
                    setIsPlaying(false);
                  }}
                ></motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              key="notPlaying"
              animate={{ rotate: 180 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-fit h-fit"
            >
              <PiVinylRecordThin className="w-72 h-full aspect-square text-white" />
            </motion.div>
            <h2 className="text-white font-JetbrainsMono text-lg px-5 text-center">
              Probably listening to a record
            </h2>
          </>
        )}
      </div>
    </AnimatePresence>
  );
}
