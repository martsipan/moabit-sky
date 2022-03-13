const fs = require('fs')

const request = require('request')
const nodeWebcam = require('node-webcam')
const { DateTime } = require('luxon')
const videoshow = require('videoshow')
const glob = require('glob')
const parseArgs = require('command-line-args')

const PHOTOS_FOLDER_NAME = 'photos'
const VIDEOS_FOLDER_NAME = 'videos'
const FILE_DATE_FORMAT = 'yyyy-LL-dd-HH.mm'
const FOLDER_DATE_FORMAT = 'yyyy-LL-dd-HH'
const CAPTURE_FREQUENCY = 1000 * 60 * 1 // in ms
const VIDEO_FRAME_DURATION = 0.5 // in sec

const options = parseArgs([
  { name: 'device', alias: 'd', type: String },
  { name: 'token', alias: 't', type: String },
  { name: 'chat', alias: 'c', type: String },
])

const webcam = nodeWebcam.create()

if (!options.device) {
  webcam.list(function(list) {
    console.error(`Please select a camera device. Options are: ${list}`)
  })

  return;
}

if (!options.token || !options.chat) {
  console.error('Telegram token and chat id missing')
  return;
}

function createFolder(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
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
      console.log(`Something went wrong: ${err}`)
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
    console.log('Folder does not exist')
    return
  }

  glob(`${imagesPath}/*.jpg`, {}, function (_, images) {
    const videoPath = `${VIDEOS_FOLDER_NAME}/${fileName}`;

    videoshow(images, {
      loop: VIDEO_FRAME_DURATION, 
      transition: false,
      audioChannels: 0,
    })
      .save(videoPath)
      .on('error', function (err) {
        console.log(`Something went wrong: ${err}`)
      })
      .on('end', function () {
        console.log('Saved video successfully')
        uploadToTelegram(videoPath)
      })
  })
}

function takePicture() {
  const date = DateTime.now()

  const fileName = `${date.toFormat(FILE_DATE_FORMAT)}.jpg`
  const folderName = date.toFormat(FOLDER_DATE_FORMAT)

  if (createFolder(`${PHOTOS_FOLDER_NAME}/${folderName}`)) {
    const previousDate = date.minus({ hour: 1 })
    const previousFolderName = previousDate.toFormat(FOLDER_DATE_FORMAT)
    const videoFileName = `${date.toFormat(FOLDER_DATE_FORMAT)}.mp4`
    createVideo(`${PHOTOS_FOLDER_NAME}/${previousFolderName}`, videoFileName)
  }

  const config = {
    device: options.device,
  }
  
  webcam.capture(`${PHOTOS_FOLDER_NAME}/${folderName}/${fileName}`, config, function(err) {
    console.log(`Capture new photo: ${fileName} ...`)
    
    if (err){
      console.log(`Something went wrong! ${err}`)
    }

    webcam.clear()
  }) 
}

createFolder(PHOTOS_FOLDER_NAME)
createFolder(VIDEOS_FOLDER_NAME)

setInterval(function() {
  takePicture()
}, CAPTURE_FREQUENCY)