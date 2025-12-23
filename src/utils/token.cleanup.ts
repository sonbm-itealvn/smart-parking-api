import { AppDataSource } from "../config/database";
import { RefreshToken } from "../entity/RefreshToken";

/**
 * Cleanup expired and revoked refresh tokens
 * Nên chạy định kỳ (cron job) để dọn dẹp database
 */
export const cleanupExpiredTokens = async () => {
  try {
    const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
    const now = new Date();

    // Delete expired tokens
    const result = await refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where("expires_at < :now", { now })
      .orWhere("is_revoked = :revoked", { revoked: true })
      .execute();

    console.log(`Cleaned up ${result.affected || 0} expired/revoked tokens`);
    return result.affected || 0;
  } catch (error) {
    console.error("Error cleaning up tokens:", error);
    throw error;
  }
};

