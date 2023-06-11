const fs = require('fs');

const saveFile =  async (stream,filename) => {
    const uploadDir = './public/storage';
    console.log("saving file.....")
    const path = `${uploadDir}/${filename}`
    const stringpath = JSON.stringify(path)
    const stringpath2 = filename
    // console.log(path,stringpath)
     return  await new Promise(  (res,rej)=>{
      console.log("we are here")
        stream
        .on('error', error => {
            if (stream.truncated)
                // delete the truncated file
                console.log(error)
                fs.unlinkSync(path);
                
                return rej(error);
        })
        .pipe(fs.createWriteStream(path))
        .on('error', error => {
          rej(error)
          })
         .on('finish', () => res( stringpath2))
    
         } )

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