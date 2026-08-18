declare module 'fix-webm-duration' {
  export default function fixWebmDuration(
    blob: Blob,
    durationMs: number,
    options?: { logger?: false | ((message: string) => void) },
  ): Promise<Blob>
}
