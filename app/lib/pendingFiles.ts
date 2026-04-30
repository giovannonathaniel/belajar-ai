"use client";

const pendingFiles = new Map<string, File>();

export function putPendingFile(key: string, file: File) {
  pendingFiles.set(key, file);
}

export function takePendingFile(key: string) {
  const file = pendingFiles.get(key) ?? null;
  pendingFiles.delete(key);
  return file;
}
