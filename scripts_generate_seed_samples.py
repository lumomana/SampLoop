import math
import struct
import wave
from pathlib import Path

OUT_DIR = Path('/home/ubuntu/samploop/mobile/src/assets/samples')
OUT_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_RATE = 22050


def envelope(t, attack=0.01, decay=0.4):
    if t < attack:
        return t / attack
    return math.exp(-(t - attack) / decay)


def write_wav(path: Path, samples):
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            value = max(-1.0, min(1.0, sample))
            frames.extend(struct.pack('<h', int(value * 32767)))
        wav.writeframes(bytes(frames))


def make_kick(duration=0.7):
    total = int(SAMPLE_RATE * duration)
    data = []
    for i in range(total):
        t = i / SAMPLE_RATE
        freq = 140 - 110 * min(1, t / 0.18)
        body = math.sin(2 * math.pi * freq * t)
        click = math.sin(2 * math.pi * 2200 * t) * math.exp(-t / 0.02)
        data.append((body * 0.95 + click * 0.15) * envelope(t, 0.001, 0.12))
    return data


def make_hat(duration=0.35):
    total = int(SAMPLE_RATE * duration)
    data = []
    for i in range(total):
        t = i / SAMPLE_RATE
        noise = math.sin(2 * math.pi * 7131 * t) * math.sin(2 * math.pi * 4217 * t)
        data.append(noise * envelope(t, 0.001, 0.05) * 0.8)
    return data


def make_pad(duration=1.8):
    total = int(SAMPLE_RATE * duration)
    data = []
    for i in range(total):
        t = i / SAMPLE_RATE
        root = math.sin(2 * math.pi * 220 * t)
        fifth = math.sin(2 * math.pi * 330 * t)
        air = math.sin(2 * math.pi * 660 * t) * 0.25
        slow = 0.75 + 0.25 * math.sin(2 * math.pi * 0.9 * t)
        data.append((root * 0.45 + fifth * 0.35 + air) * slow * envelope(t, 0.08, 1.8))
    return data


def make_bass(duration=1.1):
    total = int(SAMPLE_RATE * duration)
    data = []
    for i in range(total):
        t = i / SAMPLE_RATE
        freq = 55
        wave = math.sin(2 * math.pi * freq * t) + 0.35 * math.sin(2 * math.pi * freq * 2 * t)
        gate = 0.5 + 0.5 * math.sin(2 * math.pi * 2 * t)
        data.append(wave * gate * envelope(t, 0.01, 0.6) * 0.7)
    return data


FILES = {
    'amber-kick-loop.wav': make_kick(),
    'crystal-hat-loop.wav': make_hat(),
    'blue-grain-pad.wav': make_pad(),
    'golden-pulse-bass.wav': make_bass(),
}

for name, samples in FILES.items():
    write_wav(OUT_DIR / name, samples)

print('generated', ', '.join(FILES.keys()))
