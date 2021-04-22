@echo off & setlocal
FOR /r %%i in (*.png) DO ffmpeg -i "%%~fi" -lossless 1 "%%~dpni%.webp"