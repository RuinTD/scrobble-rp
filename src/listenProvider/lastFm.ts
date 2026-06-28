import * as Time from "@std/datetime/constants";
import chalk from "chalk";
import { getLogger } from "../lib/logger.ts";
import ExpiryMap from "expiry-map";
import ky, { isKyError } from "ky";
import pMemoize from "p-memoize";
import { z } from "zod/v4";
import config, { lastFmApiKey as apiKey } from "../config/index.ts";
import type { ListenProvider, Track, User } from "./index.ts";

const api = ky.create({
  baseUrl: "https://ws.audioscrobbler.com/2.0/",
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});
const log = getLogger(chalk.hex("#ba0000")("Last.fm"));
const { username } = config;

let isReady = false;
function ready() {
  if (isReady) return;
  log.log(chalk.green("First check successful!"));
  isReady = true;
}

export const LastFMError = z.object({ error: z.number(), message: z.string() });
export type LastFMError = z.infer<typeof LastFMError>;

const hashtext = z.object({ "#text": z.string() }).transform((v) => v["#text"]);
const image = z.array(hashtext).transform((v) => v.at(-1));

export const LastFMTrack = z.object({
  artist: hashtext,
  image,
  album: hashtext,
  name: z.string(),
  "@attr": z.optional(
    z.object({
      nowplaying: z.stringbool().optional(),
    }),
  ),
  url: z.url(),
});
export const LastFMTracks = z.object({
  recenttracks: z.object({
    track: z.array(LastFMTrack),
  }),
});

async function sendRequest(params: Record<string, string>): Promise<unknown> {
  const data = await api.get("", {
    searchParams: {
      api_key: apiKey,
      format: "json",
      ...params,
    },
  }).json();

  const error = LastFMError.safeParse(data);
  if (error.success) {
    throw new Error(`Error ${error.data.error}: ${error.data.message}`);
  }

  return data;
}

async function _getListening(): Promise<Track | undefined | null> {
  try {
    const data = await sendRequest({
      method: "user.getrecenttracks",
      user: username,
      limit: "1",
    });
    log.debug("lastfm recent", data);
    const tracks = LastFMTracks.parse(data);
    const track = tracks.recenttracks.track[0];
    ready();

    if (!track || !track["@attr"]?.nowplaying) return;
    const ret: Track = {
      name: track.name,
      artist: track.artist,
      album: track.album,
      image: track.image,
      url: track.url,
    };
    if (config.showRemainingTime) {
      const info = await getTrackInfo(track.name, track.artist);
      ret.durationMS = info?.duration;
    }

    return ret;
  } catch (e) {
    if (isKyError(e)) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return null;
  }
}
const getListening = pMemoize(_getListening, {
  cache: new ExpiryMap(Time.SECOND * 5),
});

const LastFMUser = z.object({
  name: z.string(),
  image,
  url: z.url(),
});
const LastAPIUser = z.object({ user: LastFMUser });

async function _getUser(): Promise<User | undefined> {
  try {
    const data = await sendRequest({
      method: "user.getinfo",
      user: username,
    });
    const { user } = LastAPIUser.parse(data);
    log.debug("lastfm user", user);

    if (!user) return;
    return {
      name: user.name,
      image: user.image,
      url: user.url,
    };
  } catch (e) {
    if (isKyError(e)) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
const getUser = pMemoize(_getUser, { cache: new ExpiryMap(Time.MINUTE * 5) });

const LastAPITrackInfo = z.object({
  track: z.object({
    url: z.url(),
    duration: z.coerce.number().optional(),
  }),
});

async function _getTrackInfo(track: string, artist: string) {
  try {
    const data = await sendRequest({
      method: "track.getInfo",
      track,
      artist,
    });
    return LastAPITrackInfo.parse(data).track;
  } catch (e) {
    if (isKyError(e)) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
export const getTrackInfo = pMemoize(_getTrackInfo, {
  cache: new ExpiryMap(Time.DAY),
});

const LastFMProvider: ListenProvider = {
  name: "Last.fm",
  logoAsset: "lastfm",

  getListening,
  getUser,
};
export default LastFMProvider;
