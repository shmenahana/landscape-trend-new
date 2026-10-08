// Minimal, dependency-free ZIP writer (store method / no compression).
//
// Guest photos are already-compressed JPEGs, so storing them uncompressed costs
// nothing and lets us stream the archive one file at a time — peak memory is a
// single photo, not the whole gallery. Requires the Node.js runtime (Buffer/fs).

import fs from "fs/promises";

// Precomputed CRC-32 lookup table (IEEE polynomial 0xEDB88320).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// MS-DOS date/time fields (2-second resolution). Fixed epoch keeps output stable.
function dosDateTime(d: Date): { time: number; date: number } {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const year = Math.max(1980, d.getFullYear());
  const date = ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export type ZipFile = { name: string; path: string };

/**
 * Stream a ZIP of the given files as an HTTP Response. Files that can't be read
 * are skipped rather than aborting the whole archive. Names should be unique;
 * duplicates are disambiguated by the caller.
 */
export function zipResponse(files: ZipFile[], filename: string): Response {
  const encoder = new TextEncoder();
  const stamp = dosDateTime(new Date());
  const central: Buffer[] = [];
  let offset = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const f of files) {
          let data: Buffer;
          try {
            data = await fs.readFile(f.path);
          } catch {
            continue; // missing/unreadable file — skip it
          }
          const nameBytes = Buffer.from(encoder.encode(f.name));
          const crc = crc32(data);
          const size = data.length;

          const local = Buffer.alloc(30);
          local.writeUInt32LE(0x04034b50, 0); // local file header signature
          local.writeUInt16LE(20, 4); // version needed
          local.writeUInt16LE(0x0800, 6); // general purpose flag: UTF-8 names
          local.writeUInt16LE(0, 8); // method: store
          local.writeUInt16LE(stamp.time, 10);
          local.writeUInt16LE(stamp.date, 12);
          local.writeUInt32LE(crc, 14);
          local.writeUInt32LE(size, 18); // compressed size
          local.writeUInt32LE(size, 22); // uncompressed size
          local.writeUInt16LE(nameBytes.length, 26);
          local.writeUInt16LE(0, 28); // extra field length
          controller.enqueue(local);
          controller.enqueue(nameBytes);
          controller.enqueue(data);

          const cd = Buffer.alloc(46);
          cd.writeUInt32LE(0x02014b50, 0); // central directory header signature
          cd.writeUInt16LE(20, 4); // version made by
          cd.writeUInt16LE(20, 6); // version needed
          cd.writeUInt16LE(0x0800, 8); // flag: UTF-8
          cd.writeUInt16LE(0, 10); // method: store
          cd.writeUInt16LE(stamp.time, 12);
          cd.writeUInt16LE(stamp.date, 14);
          cd.writeUInt32LE(crc, 16);
          cd.writeUInt32LE(size, 20);
          cd.writeUInt32LE(size, 24);
          cd.writeUInt16LE(nameBytes.length, 28);
          cd.writeUInt16LE(0, 30); // extra len
          cd.writeUInt16LE(0, 32); // comment len
          cd.writeUInt16LE(0, 34); // disk number
          cd.writeUInt16LE(0, 36); // internal attrs
          cd.writeUInt32LE(0, 38); // external attrs
          cd.writeUInt32LE(offset, 42); // relative offset of local header
          central.push(Buffer.concat([cd, nameBytes]));

          offset += local.length + nameBytes.length + size;
        }

        const cdBuf = Buffer.concat(central);
        controller.enqueue(cdBuf);

        const eocd = Buffer.alloc(22);
        eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
        eocd.writeUInt16LE(0, 4); // disk number
        eocd.writeUInt16LE(0, 6); // central dir start disk
        eocd.writeUInt16LE(central.length, 8); // entries on this disk
        eocd.writeUInt16LE(central.length, 10); // total entries
        eocd.writeUInt32LE(cdBuf.length, 12); // central dir size
        eocd.writeUInt32LE(offset, 16); // central dir offset
        eocd.writeUInt16LE(0, 20); // comment length
        controller.enqueue(eocd);

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
