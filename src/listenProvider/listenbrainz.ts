import config from "../config/index.ts";
import chalk from "chalk";
import { z } from "zod/v4";
import axios, { AxiosError } from "axios";
import type { ListenProvider, Track } from "./index.ts";
import * as Time from "@std/datetime/constants";
import pMemoize from "p-memoize";
import ExpiryMap from "expiry-map";
import { consola } from "consola";

const api = axios.create({
  baseURL: config.listenBrainzAPIURL || "https://api.listenbrainz.org",
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});
const log = consola.withTag(
  // chalk.hex("#353070")("Listen") + chalk.hex("#eb743b")("Brainz")
  chalk.hex("#eb743b")("ListenBrainz"),
);
const { username } = config;

let isReady = false;
function ready() {
  if (isReady) return;
  log.success(chalk.green("First check successful!"));
  isReady = true;
}

const Lookup = z.object({
  artist_mbids: z.array(z.string()).optional(),
  recording_mbid: z.string().optional(),
  release_mbid: z.string().optional(),
  metadata: z.optional(
    z.object({
      recording: z.object({
        length: z.number().optional(),
      }),
      release: z.object({
        caa_id: z.number().optional(),
        caa_release_mbid: z.string().optional(),
      }),
    }),
  ),
});
type Lookup = z.infer<typeof Lookup>;

async function _lookup(
  track: string,
  artist: string,
  album?: string,
): Promise<Lookup | undefined> {
  try {
    const { data } = await api.get("/1/metadata/lookup/", {
      params: {
        recording_name: track,
        artist_name: artist,
        release_name: album,
        inc: "release",
        metadata: true,
      },
    });
    return Lookup.parse(data);
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
export const lookupMetadata = pMemoize(_lookup, {
  cache: new ExpiryMap(Time.HOUR),
});

const LBPlayingAPI = z.object({
  payload: z.object({
    listens: z.tuple([]).or(
      z.tuple([
        z.object({
          track_metadata: z.object({
            additional_info: z.optional(
              z.object({
                music_service_name: z.string().optional(),
                origin_url: z.string().optional(),
                duration_ms: z.number().optional(),
                duration: z.number().optional(),
              }),
            ),
            artist_name: z.string(),
            release_name: z.string().optional(),
            track_name: z.string(),
          }),
        }),
      ]),
    ),
  }),
});

async function _getListening(): Promise<Track | undefined | null> {
  try {
    const { data } = await api.get(`/1/user/${username}/playing-now`);
    log.debug("listenbrainz playing now", data);

    const resp = LBPlayingAPI.parse(data);
    const track = resp.payload.listens[0]?.track_metadata;
    ready();
    if (!track) return;

    const ret: Track = {
      name: track.track_name,
      artist: track.artist_name,
      album: track.release_name,
    };

    const lookup = await lookupMetadata(
      track.track_name,
      track.artist_name,
      track.release_name,
    );
    if (lookup?.metadata) {
      const { metadata } = lookup;
      const { caa_release_mbid, caa_id } = metadata.release;

      if (caa_release_mbid && caa_id) {
        ret.image =
          `http://coverartarchive.org/release/${caa_release_mbid}/${caa_id}-500.jpg`;
      }
      if (lookup.recording_mbid) {
        ret.url = `https://musicbrainz.org/recording/${lookup.recording_mbid}`;
      }

      if (metadata.recording.length) ret.durationMS = metadata.recording.length;
    }

    const info = track.additional_info || {};
    if (info.duration) ret.durationMS = info.duration * Time.SECOND;
    if (info.duration_ms) ret.durationMS = info.duration_ms;
    if (info.origin_url) ret.trackURL = info.origin_url;

    return ret;
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return null;
  }
}
const getListening = pMemoize(_getListening, {
  cache: new ExpiryMap(Time.SECOND * 5),
});

const LBProvider: ListenProvider = {
  name: "ListenBrainz",
  logoAsset: "listenbrainz",

  getListening,
  getUser() {
    return Promise.resolve({
      name: username,
      // LB doesn't have profile pictures
      url: `https://listenbrainz.org/user/${username}`,
    });
  },
};
export default LBProvider;
