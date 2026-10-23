# Records the whole presentation as an MP4, pressing "next" step by step.
#
# Needs the presentation running (start_presentation.bat, or the Python API
# on :8000 plus the website on :3000), then from the project folder:
#     py tools\record_video.py
#
# Edge renders the page off-screen; every frame it paints is captured and fed
# to ffmpeg at a steady 30 fps, so the video plays at real speed.

import asyncio
import base64
import subprocess
import threading
import time
from pathlib import Path

import imageio_ffmpeg
from playwright.async_api import async_playwright

URL = "http://localhost:3000/?record=1#1.1"
OUTPUT = Path(__file__).resolve().parent.parent / "Chaos_Game_Presentation.mp4"
WIDTH, HEIGHT, FPS = 1920, 1080, 30

PAUSE = 3.0  # seconds to hold after each press
# Steps whose animation itself runs longer than the pause: wait for it to finish, plus a beat.
LONGER = {
    "#1.1": 4.0,   # dots burst into a cloud
    "#2.1": 5.5,   # population dots appear one by one
    "#3.4": 7.0,   # nine slow jumps
    "#3.5": 7.0,   # 10,000 points fill in
    "#6.2": 7.0,   # the loop draws 10,000 points
    "#12.1": 5.5,  # the fern grows
    "#15.2": 4.5,  # the dot bursts into the pattern
}


class FrameWriter:
    """Writes the latest captured frame to ffmpeg 30 times a second."""

    def __init__(self, path: Path):
        self.latest: bytes | None = None
        self.running = True
        self.proc = subprocess.Popen(
            [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
             "-f", "image2pipe", "-framerate", str(FPS), "-c:v", "mjpeg", "-i", "-",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
             "-movflags", "+faststart", str(path)],
            stdin=subprocess.PIPE,
        )
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.frames = 0

    def run(self):
        next_at = time.perf_counter()
        while self.running:
            if self.latest is not None:
                self.proc.stdin.write(self.latest)
                self.frames += 1
            next_at += 1 / FPS
            delay = next_at - time.perf_counter()
            if delay > 0:
                time.sleep(delay)

    def start(self):
        self.thread.start()

    def finish(self):
        self.running = False
        self.thread.join()
        self.proc.stdin.close()
        self.proc.wait()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--use-angle=d3d11"],
        )
        page = await browser.new_page(viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1)
        await page.goto(URL)
        # wait until every cell has run on the Python backend and the first slide is up
        await page.wait_for_selector(".topbar", timeout=120_000)
        await page.mouse.move(WIDTH - 2, HEIGHT - 2)  # park the mouse so the controls fade out

        writer = FrameWriter(OUTPUT)
        cdp = await page.context.new_cdp_session(page)

        async def on_frame(event):
            writer.latest = base64.b64decode(event["data"])
            await cdp.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

        cdp.on("Page.screencastFrame", lambda e: asyncio.ensure_future(on_frame(e)))
        await cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 92, "maxWidth": WIDTH, "maxHeight": HEIGHT, "everyNthFrame": 1})
        while writer.latest is None:
            await asyncio.sleep(0.05)
        writer.start()

        steps = 1
        hash_now = await page.evaluate("location.hash")
        while True:
            hold = LONGER.get(hash_now, PAUSE)
            print(f"{hash_now:>7}  holding {hold:.1f}s")
            await asyncio.sleep(hold)
            await page.keyboard.press("ArrowRight")
            await asyncio.sleep(0.2)
            hash_next = await page.evaluate("location.hash")
            if hash_next == hash_now:  # last step: nothing more to show
                break
            hash_now = hash_next
            steps += 1

        await asyncio.sleep(1.0)
        await cdp.send("Page.stopScreencast")
        writer.finish()
        await browser.close()
        print(f"Recorded {steps} steps, {writer.frames} frames ({writer.frames / FPS:.0f} s) -> {OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
