export type ShardNode = {
    position: number,
    shardId: string
}

export interface ShortenRequest {
  longUrl:   string;
  expiresIn?: '1h' | '24h' | '7d' | '30d';
  userId?:   string;
}

export interface UrlRecord {
  shortCode: string;
  longUrl:   string;
  userId?:   string;
  shardId:   string;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface ClickEvent {
  shortCode: string;
  shardId:   string;
  country:   string;
  device:    string;
  timestamp: number;
}

export interface AppError extends Error {
  statusCode: number;
  code:       string;
}