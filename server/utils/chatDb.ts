import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * AI 助手聊天记录数据库(SQLite,单文件零运维)
 *
 * - users:飞书登录用户(id 为 open_id;本地开发用 dev: 前缀模拟)
 * - conversations:会话元信息,按用户隔离
 * - conversation_messages:每个会话的完整 UIMessage[] JSON(整体替换,保存幂等)
 * - qa_logs:问答归类日志 —— 记录提问与 AI 实际读取的文档路径,
 *   文档路径天然就是组件分类标签,后续统计"哪个组件被问最多/文档缺口"
 */
let db: Database.Database | null = null;

export function useChatDb(): Database.Database {
  if (db) return db;

  const dataDir = join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });
  db = new Database(join(dataDir, "assistant.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS conversation_messages (
      conversation_id TEXT PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
      messages TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS qa_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      conversation_id TEXT,
      message_id TEXT,
      question TEXT NOT NULL,
      doc_paths TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(conversation_id, message_id)
    );
  `);

  return db;
}

/** 会话中的用户身份(存于加密 session cookie) */
export interface AuthUser {
  id: string;
  name: string;
  avatar?: string;
}

/** 新建或更新用户档案 */
export function upsertUser(user: AuthUser) {
  useChatDb()
    .prepare(
      `INSERT INTO users (id, name, avatar) VALUES (@id, @name, @avatar)
       ON CONFLICT(id) DO UPDATE SET name = @name, avatar = @avatar`,
    )
    .run({ avatar: null, ...user });
}
