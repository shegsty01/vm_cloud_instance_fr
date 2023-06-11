const fs = require('fs');
const path = require('path')
const  { Storage } = require('@google-cloud/storage');
const bucketName = 'uhsoka-storage-bucket1'

const saveFile =  async (stream,filename,bucketName) => {
    const storage = new Storage({ keyFilename: path.join(__dirname, "./leafy-glyph-388500-4b14fc99dd91.json") });
     
    const uploadDir = './public/storage';
    console.log("saving file.....")
    //const path = `${uploadDir}/${filename}`
    //const stringpath = JSON.stringify(path)
    let sanitizedName = filename
    const stringpath2 = filename

   return await new Promise((res, reject) => {
    stream.pipe(
      storage
        .bucket(bucketName)
        .file(sanitizedName)
        .createWriteStream())
        .on("finish", () => {
          storage
            .bucket(bucketName)
            .file(sanitizedName).makePublic()
            res(stringpath2)
        })
         .on('error',error=>{
                console.log(error,"shithappens.jpeg")
            })})
        


    // console.log(path,stringpath)
    //  return  await new Promise(  (res,rej)=>{
    //   console.log("we are here")
    //     stream
    //     .on('error', error => {
    //         if (stream.truncated)
    //             // delete the truncated file
    //             console.log(error)
    //             fs.unlinkSync(path);
                
    //             return rej(error);
    //     })
    //     .pipe(fs.createWriteStream(path))
    //     .on('error', error => {
    //       rej(error)
    //       })
    //      .on('finish', () => res( stringpath2))
    
    //      } )

      }


    //   const saveFile = async (stream,filename) => {
    //     const uploadDir = './public/storage';
    //     console.log("saving file.....")
    //     const path = `${uploadDir}/${filename}`
    //     const stringpath = JSON.stringify(path)
    //     const stringpath2 = filename
    //     // console.log(path,stringpath)
    //      return await new Promise(async (res,rej)=>{
    //       stream
    //         .on('error', error => {
    //             if (stream.truncated)
    //                 // delete the truncated file
    //                 console.log(error)
    //                 fs.unlinkSync(path);
                    
    //            return rej(error);
    //         })
    //         .pipe(fs.createWriteStream(path))
    //         .on('error', error => rej(error))
    //         .on('finish', () => res( stringpath2))
    //        })
    
    //       }
      module.exports = saveFile