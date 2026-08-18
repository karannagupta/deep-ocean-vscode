#!/usr/bin/env python3
"""Generate images/icon.png (128x128) for the marketplace listing."""

import math
import os
import struct
import zlib

SIZE = 128
SS = 4  # supersample factor for anti-aliasing
W = H = SIZE * SS

BG_TOP = (0x1F, 0x46, 0x62)
BG_BOTTOM = (0x12, 0x27, 0x38)
AMBER = (0xFF, 0xC6, 0x00)

WAVES = [
    # (vertical center, amplitude, thickness, opacity)
    (0.40, 0.075, 0.075, 1.00),
    (0.60, 0.065, 0.060, 0.55),
    (0.78, 0.055, 0.045, 0.28),
]


def blend(base, top, alpha):
    return tuple(round(b + (t - b) * alpha) for b, t in zip(base, top))


def main():
    rows = []
    for y in range(H):
        t = y / (H - 1)
        base = tuple(
            round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM)
        )
        row = [base] * W
        rows.append(row)

    for cy, amp, thick, opacity in WAVES:
        half = thick * H / 2
        for x in range(W):
            phase = x / W * math.tau * 1.5
            wave_y = cy * H + math.sin(phase) * amp * H
            lo = max(0, int(wave_y - half))
            hi = min(H - 1, int(wave_y + half))
            for y in range(lo, hi + 1):
                rows[y][x] = blend(rows[y][x], AMBER, opacity)

    # Downsample by averaging each SS x SS block.
    raw = bytearray()
    for y in range(SIZE):
        raw.append(0)  # PNG filter type: none
        for x in range(SIZE):
            r = g = b = 0
            for dy in range(SS):
                for dx in range(SS):
                    pr, pg, pb = rows[y * SS + dy][x * SS + dx]
                    r += pr
                    g += pg
                    b += pb
            n = SS * SS
            raw += bytes((r // n, g // n, b // n))

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        return out + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")

    dest = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "images",
        "icon.png",
    )
    with open(dest, "wb") as fh:
        fh.write(png)
    print(f"wrote {dest} ({len(png)} bytes)")


if __name__ == "__main__":
    main()
