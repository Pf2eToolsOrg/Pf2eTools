# Run in each directory, using Git Bash. Requires FFMPEG.
for i in *.jpg *.png; do ffmpeg -y -i "$i" -lossless 1 -preset drawing "${i%.*}.webp"; done
