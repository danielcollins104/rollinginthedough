import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { achievements } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const achievementsRouter = router({
  getForUser: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    return db.select().from(achievements).where(eq(achievements.userId, ctx.user.id));
  }),
  unlock: protectedProcedure
    .input(
      z.object({
        achievementType: z.enum([
          'first_spin',
          'first_win',
          'first_big_win',
          'jackpot',
          'streak_7',
          'streak_14',
          'streak_30',
          'streak_100',
          'level_5',
          'level_10',
          'level_25',
          'total_spins_100',
          'total_spins_1000',
          'total_wins_50',
          'total_wins_500',
        ])
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Check if the achievement is already unlocked for this user
      const existing = await db
        .select()
        .from(achievements)
        .where(
          and(
            eq(achievements.userId, ctx.user.id),
            eq(achievements.achievementType, input.achievementType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Already unlocked, return early
        return existing[0];
      }

      // Insert new achievement
      const [newAchievement] = await db
        .insert(achievements)
        .values({
          userId: ctx.user.id,
          achievementType: input.achievementType,
        })
        .returning();

      return newAchievement;
    }),
});

export type AchievementsRouter = typeof achievementsRouter;