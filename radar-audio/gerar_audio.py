"""Gera exclusivamente um MP3 jornalistico no runner do GitHub (sem credenciais)."""
import asyncio
import hashlib
import re
import subprocess
import tempfile
from pathlib import Path

import edge_tts
import imageio_ffmpeg
from mutagen.mp3 import MP3

VOICE = "pt-BR-ThalitaMultilingualNeural"
INPUT = Path("radar-audio/roteiro-2026-11-22.txt")
OUTPUT = Path("radar-audio/output/Radar_Diario.mp3")

def split_chunks(text, limit=950):
    chunks=[]
    current=""
    for sentence in re.split(r"(?<=[.!?])\s+", re.sub(r"\s+"," ",text).strip()):
        items=[sentence] if len(sentence)<=limit else sentence.split()
        for item in items:
            if len(item)>limit:
                raise ValueError("Trecho maior que limite")
            if len(current)+len(item)+1>limit:
                if current:
                    chunks.append(current)
                current=item
            else:
                current=(current+" "+item).strip()
    if current:
        chunks.append(current)
    return chunks

async def generate_one(index, text, folder, total, semaphore):
    digest=hashlib.sha256((VOICE+text).encode()).hexdigest()[:14]
    path=folder / f"part_{index:03d}_{digest}.mp3"
    async with semaphore:
        if path.exists() and path.stat().st_size>1000:
            return path
        for attempt in range(1,7):
            try:
                path.unlink(missing_ok=True)
                await asyncio.wait_for(
                    edge_tts.Communicate(text,voice=VOICE,rate="+10%",pitch="+0Hz").save(str(path)),
                    timeout=95
                )
                if path.stat().st_size<=1000:
                    raise RuntimeError("Trecho de audio vazio")
                print(f"TTS {index+1}/{total}: {path.stat().st_size} bytes",flush=True)
                return path
            except Exception as exc:
                print(f"TTS {index+1}/{total}, tentativa {attempt}/6: {type(exc).__name__}: {str(exc)[:160]}",flush=True)
                path.unlink(missing_ok=True)
                if attempt==6:
                    raise
                await asyncio.sleep(min(60,attempt*attempt*5))

async def synthesize(text,folder):
    items=split_chunks(text)
    if len(items)<10:
        raise ValueError("Roteiro invalido: poucos trechos")
    semaphore=asyncio.Semaphore(2)
    tasks=[generate_one(i,item,folder,len(items),semaphore) for i,item in enumerate(items)]
    paths=await asyncio.gather(*tasks)
    manifest=folder/"concat.txt"
    manifest.write_text("".join(f"file '{p.name}'\n" for p in paths),encoding="utf-8")
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(
        [imageio_ffmpeg.get_ffmpeg_exe(),"-hide_banner","-loglevel","error",
         "-y","-f","concat","-safe","0","-i",str(manifest),
         "-c:a","libmp3lame","-q:a","5",str(OUTPUT)],
        check=True,timeout=120,
    )
    return OUTPUT

def adjust_duration(path):
    original=MP3(str(path)).info.length
    print(f"Duracao inicial: {original:.1f} segundos",flush=True)
    if not 900<=original<=1020:
        goal=990.0
        ratio=original/goal
        if not 0.5<=ratio<=2:
            raise ValueError(f"Duracao muito distante da meta: {original:.0f} segundos")
        corrected=path.with_name("Corrigido.mp3")
        subprocess.run(
            [imageio_ffmpeg.get_ffmpeg_exe(),"-hide_banner","-loglevel","error","-y",
             "-i",str(path),"-filter:a",f"atempo={ratio:.6f}",
             "-c:a","libmp3lame","-q:a","5",str(corrected)],
            check=True,timeout=180
        )
        corrected.replace(path)
    final=MP3(str(path)).info.length
    if not 895<=final<=1030 or path.stat().st_size < 100000:
        raise ValueError(f"MP3 fora das especificacoes: {final:.1f}s, {path.stat().st_size} bytes")
    print(f"MP3 PRONTO: {path.stat().st_size} bytes; {final:.1f} segundos",flush=True)

if __name__=="__main__":
    text=INPUT.read_text(encoding="utf-8").strip()
    if len(text)<14000 or len(text.split())<2100:
        raise ValueError("Narracao abaixo do minimo editorial")
    with tempfile.TemporaryDirectory() as temp:
        path=asyncio.run(synthesize(text,Path(temp)))
        adjust_duration(path)
