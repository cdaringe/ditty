#!/usr/bin/env bash
set -exo pipefail
export LOG_LEVEL=static
URL=https://omnycontent.com/d/playlist/e73c998e-6e60-432f-8610-ae210140c5b1/A91018A4-EA4F-4130-BF55-AE270180C327/44710ECC-10BB-48D1-93C7-AE270180C33E/podcast.rss
podcast-dl \
  --url $URL \
  --out-dir data \
  --include-meta \
  --limit 5 \
  --episode-template "{{release_date}}-{{title}}" \
  --archive archive.json
