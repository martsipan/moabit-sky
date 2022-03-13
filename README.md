# moabit-sky

Take a picture every 5 minutes with a webcam, make a video out of the images every 24 hours and upload it into a Telegram channel.

## Requirements

* `node` and `npm`
* `ffmpeg`
* `imagesnap` (MacOS) or `fswebcam` (Linux)
* [Telegram Bot](https://core.telegram.org/bots#3-how-do-i-create-a-bot) running inside channel

## Usage

```bash
# Install dependencies
npm install

# Run program with configuration arguments
node index.js --device "USB Camera" --token "Telegram Token" --chat "Telegram Chat ID"
```

**Arguments**

* `--device` Name of camera device, for example `/dev/video0`. Leave empty to get a list of options
* `--token` API Token for Telegram Bot uploading video to channel
* `--chat` Identifier of the Telegram chat
* `--timezone` IANA Timezone name, for example `Europe/Berlin` (optional)
* `--folder` Path of folder where photos and images are stored (optional)

## License

`UNLICENSE`
