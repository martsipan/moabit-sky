const fs = require('fs')
const process = require('process')
const path = require('path')

const glob = require('glob')
const nodeWebcam = require('node-webcam')
const parseArgs = require('command-line-args')
const request = require('request')
const videoshow = require('videoshow')
const { DateTime } = require('luxon')

const PHOTOS_FOLDER_NAME = 'photos'
const VIDEOS_FOLDER_NAME = 'videos'

const FILE_DATE_FORMAT = 'yyyy-LL-dd_HH.mm'
const FOLDER_DATE_FORMAT = 'yyyy-LL-dd'

const CAPTURE_FREQUENCY = 1000 * 60 * 5 // in ms
const VIDEO_FRAME_DURATION = 0.25 // in sec
const VIDEO_HOUR = 22 // Make a video at this time of the day (0-23 hours)

const options = parseArgs([
  { name: 'device', alias: 'd', type: String },
  { name: 'token', alias: 't', type: String },
  { name: 'chat', alias: 'c', type: String },
  { name: 'folder', alias: 'f', type: String, defaultValue: __dirname },
])

if (!options.device) {
  nodeWebcam.create().list(function (list) {
    console.error(`Please select a camera device. Options are: ${list}`)
    process.exit(1)
  })
} else if (!options.token || !options.chat) {
  console.error('Telegram token and chat id missing')
  process.exit(1)
}

const webcam = nodeWebcam.create({ device: options.device })

function getPath(path) {
  return path.join(options.folder, ...path);
}

function createFolder(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
    return true
  } else {
    return false
  }
}

function uploadToTelegram(filePath) {
  console.log(`Try uploading ${filePath} to Telegram channel ...`)

  const url = `https://api.telegram.org/bot${options.token}/sendDocument`

  const req = request(url, (err) => {
    if (err) {
      console.error(`Something went wrong: ${err}`)
    }

    console.log('Successfully uploaded video to Telegram channel')
  })

  const form = req.form()
  form.append('chat_id', options.chat)
  form.append('document', fs.createReadStream(filePath))
}

function createVideo(imagesPath, fileName) {
  console.log(`Try creating new video: ${imagesPath} ...`)

  if (!fs.existsSync(imagesPath)) {
    console.error('Folder does not exist')
    return
  }

  glob(`${imagesPath}/*.jpg`, {}, function (_, images) {
    const videoPath = getPath([VIDEOS_FOLDER_NAME, fileName])

    videoshow(images, {
      loop: VIDEO_FRAME_DURATION,
      transition: false,
      audioChannels: 0,
    })
      .save(videoPath)
      .on('error', function (err) {
        console.error(`Something went wrong: ${err}`)
      })
      .on('end', function () {
        console.error('Saved video successfully')
        uploadToTelegram(videoPath)
      })
  })
}

function takePicture() {
  const date = DateTime.now()

  // Define file name of image being taken
  const fileName = `${date.toFormat(FILE_DATE_FORMAT)}.jpg`

  // Define folder name where to store image inside
  let folderName = date.toFormat(FOLDER_DATE_FORMAT)
  if (date.hour >= VIDEO_HOUR) {
    // Go over to next day if we crossed the "video hour"
    folderName = date
      .plus({ hours: 24 - VIDEO_HOUR })
      .toFormat(FOLDER_DATE_FORMAT)
  }

  // Create folder if it does not exist yet
  const folderCreated = createFolder(getPath([PHOTOS_FOLDER_NAME, folderName]))

  // Create a video at "video hour"
  if (date.hour === VIDEO_HOUR && folderCreated) {
    const previousFolderName = date.toFormat(FOLDER_DATE_FORMAT)
    const videoFileName = `${date.toFormat(FOLDER_DATE_FORMAT)}.mp4`
    createVideo(getPath([PHOTOS_FOLDER_NAME, previousFolderName]), videoFileName)
  }

  webcam.capture(
    getPath([PHOTOS_FOLDER_NAME, folderName, fileName]),
    function (err) {
      console.log(`Capture new photo: ${fileName} ...`)

      if (err) {
        console.error(`Something went wrong! ${err}`)
      }

      webcam.clear()
    }
  )
}

createFolder(getPath([PHOTOS_FOLDER_NAME]))
createFolder(getPath([VIDEOS_FOLDER_NAME]))

setInterval(function () {
  takePicture()
}, CAPTURE_FREQUENCY)
