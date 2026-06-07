import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiVinylRecordThin } from "react-icons/pi";

const CURRENT_TRACK_URL = "https://spotify-worker.dapice.dev/currentTrack";
const POLL_INTERVAL_MS = 15000;

// The worker response is an external trust boundary; only let https: URLs from
// it reach an href/src so a compromised/MITM'd response can't inject a
// javascript:/data: URI into the DOM.
const safeHttpsUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

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

  const isActiveRef = useRef(true);
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
    };
  }, []);

  const fetchCurrentTrack = useCallback(async () => {
    try {
      const r = await fetch(CURRENT_TRACK_URL, {
        headers: {
          Authorization: `Basic dGVzdFNwb3RpZnk6UG9ydGZvbGlvU2l0ZQ==`,
        },
      });
      if (!r.ok || !isActiveRef.current) return;

      const body = (await r.json()) as SpotifyResponse;
      if (!isActiveRef.current) return;

      if (
        body.isPlaying &&
        body.currentTrack &&
        body.currentTrackProgress != null
      ) {
        setTrack(body.currentTrack);
        setTrackProgress(Math.round(body.currentTrackProgress / 1000));
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setTrack(undefined);
        setTrackProgress(undefined);
      }
    } catch {
      // Network/parse error — keep the last known state and retry next tick.
    }
  }, []);

  // Poll the worker on a fixed interval so the widget recovers from the idle
  // state (and picks up new tracks) without depending on render state.
  useEffect(() => {
    fetchCurrentTrack();
    const id = setInterval(fetchCurrentTrack, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchCurrentTrack]);

  useEffect(() => {
    if (track && trackProgress != null) {
      const totalSeconds = Math.round(track.duration_ms / 1000);
      const remaining = totalSeconds - trackProgress;
      setDuration(remaining > 0 ? remaining : undefined);
    } else {
      setDuration(undefined);
    }
  }, [track, trackProgress]);

  return (
    <motion.div
      className="relative w-full h-full bg-gradient-to-br from-black via-gray-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 border border-cyan-400/30 rounded-lg"
        animate={{
          boxShadow: [
            "0 0 20px rgba(0, 255, 255, 0.2)",
            "0 0 30px rgba(255, 0, 255, 0.2)",
            "0 0 20px rgba(0, 255, 255, 0.2)",
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 w-full h-full p-6">
        <AnimatePresence mode="wait">
          {isPlaying && track && duration != null && trackProgress != null ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-400 font-JetbrainsMono text-xs font-bold tracking-wider">
                    NOW PLAYING
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-3 bg-cyan-400 rounded animate-pulse"></div>
                  <div
                    className="w-1 h-2 bg-cyan-400 rounded animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-4 bg-cyan-400 rounded animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-cyan-400 rounded animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
              </motion.div>

              {/* Main Content - Album Art and Info Side by Side */}
              <div className="flex-1 flex items-center space-x-6">
                {/* Album Art */}
                <motion.div
                  className="relative flex-shrink-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-purple-500/30 rounded-xl blur-lg"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.a
                    href={safeHttpsUrl(track.album.external_urls.spotify)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img
                      className="relative w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl border-2 border-cyan-400/50 hover:border-cyan-400 transition-all duration-300 shadow-lg"
                      src={safeHttpsUrl(track.album.images?.[0]?.url)}
                      alt={track.album.name}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 rounded-xl flex items-center justify-center">
                      <span className="text-white/0 hover:text-white/100 font-JetbrainsMono text-xs font-bold transition-colors duration-300">
                        OPEN
                      </span>
                    </div>
                  </motion.a>
                </motion.div>

                {/* Track Info */}
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {/* Song Title */}
                  <motion.a
                    href={safeHttpsUrl(track.external_urls.spotify)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group mb-2"
                    whileHover={{ x: 2 }}
                  >
                    <h2 className="text-white font-JetbrainsMono text-lg md:text-xl font-bold truncate group-hover:text-cyan-400 transition-colors duration-300">
                      {track.name}
                    </h2>
                  </motion.a>

                  {/* Artist */}
                  <motion.a
                    href={safeHttpsUrl(track.artists?.[0]?.external_urls?.spotify)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group mb-1"
                    whileHover={{ x: 2 }}
                  >
                    <p className="text-cyan-400 font-JetbrainsMono text-sm md:text-base font-medium truncate group-hover:text-cyan-300 transition-colors duration-300">
                      {track.artists?.[0]?.name}
                    </p>
                  </motion.a>

                  {/* Album */}
                  <motion.a
                    href={safeHttpsUrl(track.album.external_urls.spotify)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    whileHover={{ x: 2 }}
                  >
                    <p className="text-gray-400 font-JetbrainsMono text-xs md:text-sm truncate group-hover:text-gray-300 transition-colors duration-300">
                      {track.album.name}
                    </p>
                  </motion.a>
                </motion.div>
              </div>

              {/* Progress Bar */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    key={track.id}
                    initial={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            (trackProgress /
                              Math.max(1, Math.round(track.duration_ms / 1000))) *
                              100
                          )
                        )
                      )}%`,
                    }}
                    animate={{ width: "100%" }}
                    transition={{ duration: duration, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full relative"
                    onAnimationComplete={() => {
                      // Track finished — refresh immediately to pick up the next one.
                      fetchCurrentTrack();
                    }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="notPlaying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center"
            >
              {/* Spinning vinyl */}
              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                }}
                className="relative mb-8"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <PiVinylRecordThin className="relative w-32 h-32 md:w-40 md:h-40 text-cyan-400" />
              </motion.div>

              {/* Status Text */}
              <motion.div
                className="text-center"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <h3 className="text-cyan-400 font-JetbrainsMono text-sm md:text-base font-bold tracking-wider mb-2">
                  AUDIO STREAM IDLE
                </h3>
                <p className="text-gray-400 font-JetbrainsMono text-xs">
                  Listening to analog sources
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
