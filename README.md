# moabit-sky

Take a picture every 5 minutes with a webcam, make a video out of the images every 24 hours and upload it into a Telegram channel.

## Requirements

* `node` and `npm`
* `ffmpeg`
* `imagesnap` (MacOS) or `fswebcam` (Linux)

## Usage

```bash
npm install
npm start -- --device "USB Camera" --token "Telegram Token" --chat "Telegram Chat ID"
```

## License

`UNLICENSE`
