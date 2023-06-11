const { getGraphQLErrorsFromResult } = require('@apollo/client/utilities');
const { exec, spawn } = require('node:child_process');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');


const  Ffmpeg = async (filepath,filename) => {
    try {
  ffmpeg(filepath).seekInput('00:00:06').frames(1).
  videoFilters('select=not(mod(n'+'\\'+',10))','scale=320:240','tile=2x3').
  output(`./public/storage/${filename}.png`)
    .on("end", () => {
    console.log("Video has been converted to GIF animation successfully!");
  })
  .on("error", (err) => {
    console.log("Error: " + err.message);
  })
  .run();















    }
    catch(error){
        console.log(error,"error her ffmpeg")
    }
   
     // console.log("filebuffer",out)
}






  module.exports  = Ffmpeg