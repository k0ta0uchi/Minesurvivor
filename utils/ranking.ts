
import { RankingEntry } from '../types';
import { neon } from '@neondatabase/serverless';

const LOCAL_DB_KEY = 'MINESURVIVOR_DB_RANKING';

interface IRankingDB {
  insertScore(name: string, score: number, stage: number, characterId: string): Promise<void>;
  getTopScores(limit?: number): Promise<RankingEntry[]>;
}

/**
 * LocalStorage Implementation (Fallback)
 */
class LocalRankingDB implements IRankingDB {
  private data: RankingEntry[];

  constructor() {
    this.data = this.load();
  }

  private load(): RankingEntry[] {
    try {
      const stored = localStorage.getItem(LOCAL_DB_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load ranking DB", e);
      return [];
    }
  }

  private save() {
    try {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save ranking DB", e);
    }
  }

  public async insertScore(name: string, score: number, stage: number, characterId: string): Promise<void> {
    const entry: RankingEntry = {
      id: Date.now(),
      name: name.substring(0, 12),
      score,
      stage,
      characterId,
      timestamp: Date.now()
    };
    this.data.push(entry);
    this.data.sort((a, b) => b.score - a.score);
    if (this.data.length > 100) {
      this.data = this.data.slice(0, 100);
    }
    this.save();
  }

  public async getTopScores(limit: number = 10): Promise<RankingEntry[]> {
    return this.data.slice(0, limit);
  }
}

/**
 * Neon Database Implementation (PostgreSQL)
 */
class NeonRankingDB implements IRankingDB {
  private sql: any;
  private initialized: boolean = false;

  constructor(connectionString: string) {
    this.sql = neon(connectionString);
  }

  private async init() {
    if (this.initialized) return;
    try {
      // Create table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS rankings (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          score INTEGER NOT NULL,
          stage INTEGER NOT NULL,
          character_id TEXT NOT NULL,
          timestamp BIGINT NOT NULL
        )
      `;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Neon DB table:", error);
    }
  }

  public async insertScore(name: string, score: number, stage: number, characterId: string): Promise<void> {
    await this.init();
    try {
      await this.sql`
        INSERT INTO rankings (name, score, stage, character_id, timestamp)
        VALUES (${name}, ${score}, ${stage}, ${characterId}, ${Date.now()})
      `;
    } catch (error) {
      console.error("Failed to insert score into Neon DB:", error);
    }
  }

  public async getTopScores(limit: number = 10): Promise<RankingEntry[]> {
    await this.init();
    try {
      const result = await this.sql`
        SELECT id, name, score, stage, character_id, timestamp 
        FROM rankings 
        ORDER BY score DESC 
        LIMIT ${limit}
      `;
      
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        score: row.score,
        stage: row.stage,
        characterId: row.character_id, // Note: SQL snake_case to JS camelCase
        timestamp: Number(row.timestamp)
      }));
    } catch (error) {
      console.error("Failed to fetch scores from Neon DB:", error);
      // Fallback to empty array on error to prevent app crash
      return [];
    }
  }
}

/**
 * Factory to select the database based on environment variables.
 */
const getDatabase = (): IRankingDB => {
  // Check for DATABASE_URL or POSTGRES_URL
  // Note: For client-side bundles, these must be exposed (e.g., VITE_DATABASE_URL or defined in webpack)
  // or this code must be running in a server context.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (url) {
    console.log("Using Neon Database for Rankings");
    return new NeonRankingDB(url);
  } else {
    console.log("Using LocalStorage for Rankings (Offline Mode)");
    return new LocalRankingDB();
  }
};

export const rankingDB = getDatabase();
