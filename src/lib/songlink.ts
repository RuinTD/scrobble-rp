import * as Time from "@std/datetime/constants";
import ExpiryMap from "expiry-map";
import ky from "ky";
import pMemoize from "p-memoize";
import z from "zod/v4";

const httpUrl = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
});

const Links = z.object({
  pageUrl: httpUrl,
});

async function _tryResolveSongLink(url: string): Promise<string | undefined> {
  if (httpUrl.safeParse(url).error) return;

  const resp = await ky.get("https://api.song.link/v1-alpha.1/links", {
    headers: { "User-Agent": "https://github.com/RuinTD/scrobble-rp" },
    searchParams: { url },
    throwHttpErrors(status) {
      return status != 400;
    },
  });
  if (resp.status == 400) return;

  return Links.parse(await resp.json()).pageUrl;
}
export const tryResolveSongLink = pMemoize(_tryResolveSongLink, {
  cache: new ExpiryMap(Time.HOUR),
});
