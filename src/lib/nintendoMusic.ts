import axios from "axios";
import { z } from "zod/v4";
import { DAY } from "@std/datetime/constants";
import type { Track } from "../listenProvider/index.ts";
import ExpiryMap from "expiry-map";
import pMemoize from "p-memoize";

export const NintendoArtist = "Nintendo Co., Ltd.";

/*
Thanks to Mario Wiki for reverse engineering the API!
https://www.mariowiki.com/Talk:Nintendo_Music
*/

const api = axios.create({
  baseURL: "https://api.m.nintendo.com/catalog/",
  params: {
    lang: "en-US",
    country: "US",
    sdkVersion: "android-1.4.0_3e8b373-1",
    // membership: "BASIC",
    // packageType: "dash_cbcs",
  },
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});

const Game = z.object({
  id: z.uuid(),
  name: z.string(),
  thumbnailURL: z.url(),
});

const Games = z
  .object({
    hardware: z.array(
      z.pipe(
        z.object({ items: z.array(Game) }),
        z.transform((v) => v.items),
      ),
    ),
  })
  .transform((v) => v.hardware.flat());
type Games = z.infer<typeof Games>;

async function _getGames() {
  const { data } = await api.get("gameGroups?groupingPolicy=HARDWARE");
  return Games.parse(data);
}
export const getGames = pMemoize(_getGames, { cache: new ExpiryMap(DAY) });

const Track = z.object({
  id: z.uuid(),
  name: z.string(),
  thumbnailURL: z.url(),
});

const PartialGamePlaylist = z.object({
  id: z.uuid(),
  thumbnailURL: z.url(),
});

const GamePlaylist = z.object({
  ...PartialGamePlaylist.shape,
  tracks: z.array(Track),
});
type GamePlaylist = z.infer<typeof GamePlaylist>;

const GamePlaylists = z.object({
  allPlaylist: PartialGamePlaylist,
  bestPlaylist: GamePlaylist,
});
type GamePlaylists = z.infer<typeof GamePlaylists>;

async function _getPlaylists(gameUUID: string) {
  const { data } = await api.get(`games/${gameUUID}/relatedPlaylists`);
  return GamePlaylists.parse(data);
}
export const getPlaylists = pMemoize(_getPlaylists, {
  cache: new ExpiryMap(DAY),
});

async function _getPlaylist(playlistUUID: string) {
  const { data } = await api.get(`officialPlaylists/${playlistUUID}`);
  return GamePlaylist.parse(data);
}
export const getPlaylist = pMemoize(_getPlaylist, {
  cache: new ExpiryMap(DAY),
});

export async function getNintendoThumbnail(
  songName: string,
  gameName: string,
): Promise<string | undefined>;
export async function getNintendoThumbnail(
  track: Track,
): Promise<string | undefined>;
export async function getNintendoThumbnail(
  track: Track | string,
  gameName?: string,
) {
  if (typeof track == "string") track = { name: track, artist: gameName };
  if (!track.artist) return;

  const game = (await getGames()).find((v) => v.name == track.album);
  if (!game) return;

  const playlists = await getPlaylists(game.id);
  const ninTrack = playlists.bestPlaylist.tracks.find(
    (v) => v.name == track.name,
  );
  if (ninTrack) return ninTrack.thumbnailURL;

  const playlist = await getPlaylist(playlists.allPlaylist.id);
  const trackData = playlist.tracks.find((v) => v.name == track.name);
  return trackData?.thumbnailURL;
}
