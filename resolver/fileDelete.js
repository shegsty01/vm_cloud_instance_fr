const fs = require('fs');
const deleteFile = (file)=>{
    let size = file.length
    for(i=0;i<size;i++){
        const uploadDir = './public/storage';
        const path = `${uploadDir}/${file[i]}`
        fs.unlink(path, (err) => {
            if (err) console.log(err) //handle your error the way you want to;
            console.log(`${path}` );//or else the file will be deleted
              });
    }

        
}
module.exports = deleteFile