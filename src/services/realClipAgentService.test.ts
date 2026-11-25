import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearClipAgentCache,
  discoverRealCoachClips,
  formatSecondsToTime,
  parseDurationToSeconds,
  parseYoutubeInitialDataFromHtml,
} from './realClipAgentService';

describe('realClipAgentService', () => {
  it('formats and parses clip durations cleanly', () => {
    assert.equal(formatSecondsToTime(75), '1:15');
    assert.equal(formatSecondsToTime(9), '0:09');
    assert.equal(parseDurationToSeconds('10:32'), 632);
    assert.equal(parseDurationToSeconds('1:02:05'), 3725);
  });

  it('extracts YouTube pro videos and real chapters from ytInitialData HTML', () => {
    const mockData = {
      contents: {
        twoColumnSearchResultsRenderer: {
          primaryContents: {
            sectionListRenderer: {
              contents: [
                {
                  itemSectionRenderer: {
                    contents: [
                      {
                        videoRenderer: {
                          videoId: 'RyAg82pPs1M',
                          title: { runs: [{ text: 'Your T Side Mirage SUCKS... fix it' }] },
                          ownerText: { runs: [{ text: 'fl0m' }] },
                          lengthText: { simpleText: '10:32' },
                          shortViewCountText: { simpleText: '368K' },
                          thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/vi/RyAg82pPs1M/hqdefault.jpg' }] },
                          expandableMetadata: {
                            expandableMetadataRenderer: {
                              expandedContent: {
                                horizontalCardListRenderer: {
                                  cards: [
                                    {
                                      macroMarkersListItemRenderer: {
                                        title: { simpleText: 'Mid Mistake' },
                                        onTap: { watchEndpoint: { startTimeSeconds: 22 } },
                                      },
                                    },
                                    {
                                      macroMarkersListItemRenderer: {
                                        title: { simpleText: 'Counter Strafe Fix' },
                                        onTap: { watchEndpoint: { startTimeSeconds: 88 } },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    const html = `<html><script>var ytInitialData = ${JSON.stringify(mockData)};</script></html>`;
    const items = parseYoutubeInitialDataFromHtml(html);
    assert.equal(items.length, 1);
    assert.equal(items[0].videoId, 'RyAg82pPs1M');
    assert.equal(items[0].channelName, 'fl0m');
    assert.equal(items[0].chapters.length, 2);
    assert.equal(items[0].chapters[0].sec, 22);
  });

  it('discovers both YouTube pro and Reddit highlight clips and attaches Persian coach problem/fix breakdown', async () => {
    clearClipAgentCache();
    const mockFetcher = (async (url: string | URL) => {
      const isReddit = String(url).includes('reddit');
      const vidId = isReddit ? 'abcDEF12345' : 'zv556UTFZBo';
      const title = isReddit
        ? 'Top Reddit Defending Mistakes in EA FC 27'
        : '5 Pro Tips For Attacking in FC 27';
      const payload = {
        items: [
          {
            videoRenderer: {
              videoId: vidId,
              title: { runs: [{ text: title }] },
              ownerText: { runs: [{ text: isReddit ? 'r/EASportsFC Best' : 'Tom Leese' }] },
              lengthText: { simpleText: '8:40' },
              shortViewCountText: { simpleText: '120K' },
              thumbnail: { thumbnails: [{ url: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` }] },
            },
          },
        ],
      };
      return {
        ok: true,
        text: async () => `<script>var ytInitialData = ${JSON.stringify(payload)};</script>`,
      } as Response;
    }) as typeof fetch;

    const result = await discoverRealCoachClips(
      { gameId: 'fc27', gameName: 'EA SPORTS FC 27', realm: 'sports' },
      { fetcher: mockFetcher, force: true }
    );

    assert.equal(result.clips.length, 2);
    assert.equal(result.clips[0].sourceKind, 'youtube_pro');
    assert.equal(result.clips[1].sourceKind, 'reddit_top');
    assert.ok(result.clips[0].problemFoundFa.length > 10);
    assert.ok(result.clips[0].solutionFixFa.length > 10);
    assert.ok(result.clips[0].coachCommentaryFa.length > 20);
    assert.ok(result.clips[0].keyMoments.length >= 2);
  });
});
