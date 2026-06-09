import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ModelMessage } from "ai";

const sessionsDir = path.join(process.cwd(), "db", "ui-generation-sessions");

export type UiGenerationSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ModelMessage[];
};

function sessionPath(sessionId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    throw new Error("Invalid session id.");
  }

  return path.join(sessionsDir, `${sessionId}.json`);
}

function createSession(): UiGenerationSession {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

async function readSession(sessionId: string) {
  const raw = await readFile(sessionPath(sessionId), "utf8");
  return JSON.parse(raw) as UiGenerationSession;
}

async function writeSession(session: UiGenerationSession) {
  await mkdir(sessionsDir, { recursive: true });

  const nextSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(
    sessionPath(nextSession.id),
    JSON.stringify(nextSession, null, 2),
  );

  return nextSession;
}

export async function loadOrCreateSession({
  sessionId,
}: {
  sessionId: string;
}) {
  if (sessionId) {
    return readSession(sessionId);
  }

  return createSession();
}

export function appendSessionMessages({
  inputMessages,
  outputMessages,
  session,
}: {
  inputMessages: ModelMessage[];
  outputMessages: ModelMessage[];
  session: UiGenerationSession;
}) {
  return writeSession({
    ...session,
    messages: [...inputMessages, ...outputMessages],
  });
}
