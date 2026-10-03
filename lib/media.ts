/** `/uploads/x.mp4` → `/uploads/x.webp`, the first frame, shown until the video can play. */
export const posterFor = (src: string) => src.replace(/\.mp4$/, '.webp');
