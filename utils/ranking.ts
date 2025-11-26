
import { RankingEntry } from '../types';

const DB_KEY = 'MINESURVIVOR_DB_RANKING';

// Simulating a Database Connection
class RankingDB {
  private data: RankingEntry[];

  constructor() {
    this.data = this.load();
  }

  private load(): RankingEntry[] {
    try {
      const stored = localStorage.getItem(DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load ranking DB", e);
      return [];
    }
  }

  private save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save ranking DB", e);
    }
  }

  public async insertScore(name: string, score: number, stage: number, characterId: string): Promise<void> {
    const entry: RankingEntry = {
      id: Date.now(),
      name: name.substring(0, 12), // Limit name length
      score,
      stage,
      characterId,
      timestamp: Date.now()
    };
    this.data.push(entry);
    // Sort descending by score
    this.data.sort((a, b) => b.score - a.score);
    // Keep top 100 to simulate a realistic leaderboard limit
    if (this.data.length > 100) {
      this.data = this.data.slice(0, 100);
    }
    this.save();
  }

  public async getTopScores(limit: number = 10): Promise<RankingEntry[]> {
    return this.data.slice(0, limit);
  }
}

export const rankingDB = new RankingDB();
