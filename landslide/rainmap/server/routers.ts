import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

import { z } from "zod";
import {
  getLiveIMDAwsData,
  getLiveIMDDistrictNowcast,
  getLiveIMDDistrictWarning,
} from "./imdClient";
import { getClosestDistrictByCoordinates } from "./indianDistrictCoordinates";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
      } as const;
    }),
  }),

  // Real-time Meteo-GIS & Emergency Dispatch Router
  meteo: router({
    getLiveTelemetry: publicProcedure
      .input(
        z.object({
          lat: z.number().default(13.0827),
          lng: z.number().default(80.2707),
        })
      )
      .query(async ({ input }) => {
        const { stations, isLive } = await getLiveIMDAwsData();
        const closest = getClosestDistrictByCoordinates(input.lat, input.lng);
        return {
          isLive,
          district: closest.district,
          state: closest.state,
          stationsCount: stations.length,
          timestamp: new Date().toISOString(),
        };
      }),

    getLiveHazards: publicProcedure.query(async () => {
      const [warns, nowcasts] = await Promise.all([
        getLiveIMDDistrictWarning(),
        getLiveIMDDistrictNowcast(),
      ]);
      return {
        warningsCount: warns.warnings.length,
        nowcastsCount: nowcasts.nowcasts.length,
        isLive: warns.isLive || nowcasts.isLive,
        timestamp: new Date().toISOString(),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
