const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const md5 = require('md5');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const path = require('path');


// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();

//Middlewares
app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}))

//Cookies and file middlewares here
app.use(cookieParser());

//Images and Videos Upload...
app.use(fileUpload({
    useTempFiles:true,
    tempFileDir: ('./uploads'),
    safeFileNames: true,
    preserveExtension: 5
}));

app.use(bodyParser.raw({
    type: 'application/octet-stream',
    limit:'1000000000000000mb',
}));

app.use(cors('http://localhost:3000/'))

app.use('/uploads', express.static('uploads'));


app.post('/upload', async (req, res, next) => {
    const {name, CHUNK_SIZE, size, offset, currentChunkIndex, totalChunks} = req.query;
    console.log(name, CHUNK_SIZE, offset, currentChunkIndex, totalChunks);

    const extension = name.split('.').pop();

    const data = req.body.toString().split(',')[1];

    console.log(typeof (parseInt(offset) + parseInt(CHUNK_SIZE)));

    const buffer = new Buffer(data, 'base64');

    const temperoryFileName = 'temp_'+md5(name+req.ip)+'.'+extension;
    
    const isFirstChunk = parseInt(currentChunkIndex) === 0;
    const isLastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks)-1;

    if(isFirstChunk && fs.existsSync('./uploads/'+temperoryFileName)){
        fs.unlinkSync('./uploads/'+temperoryFileName);
    }

    //For all the Middle Chunks along with First and Last Chunk
    fs.appendFileSync('./uploads/'+temperoryFileName, buffer);
    const resOffset = parseInt(currentChunkIndex) * parseInt(CHUNK_SIZE);
    res.set('x-next-offset', `${resOffset}`)
    
    if(isLastChunk){

        //Rename the Temporary file and put it somewhere...
        const finalFileName = md5(Date.now()).substr(0,6)+'.'+extension;
        fs.renameSync('./uploads/'+temperoryFileName, './uploads/'+finalFileName);

        res.status(200).json({
            finalFileName
        });
    }else{
        res.json('ok')
    }
    
})

// app.post('/upload/sample', async (req,res)=>{
//     const data = req.files;
//     console.log(data)
//     const file = data.files;
//     const extension = file.name.split('.').pop();

//     console.log(file.name)
//     const temperoryFileName = 'temp_'+md5(file.name+req.ip)+'.'+extension;
//     console.log(temperoryFileName)

//     // fs.unlinkSync('./uploads/'+temperoryFileName);
//     // fs.appendFileSync('./uploads/'+temperoryFileName, buffer);
//     // let fileUploadFolder = "uploads";
    
//     const tempFileUploadDir = 'uploads';

//     const fileUploadDir = path.join(__dirname, tempFileUploadDir, temperoryFileName);
//     file.mv(fileUploadDir, (error) => {
//         if(error){
//             res.status(500).json({
//                 status: error,
//                 message: error.message
//             })
//         }
//     });

//     res.status(200).json({
//         status: 'success',
//         message: "File uploaded successfully"
//     })
// })

// app.post('/uploadinchunks', async (req, res) => {
//     const { chunk, offset, totalSize, fileName } = req.body;

//     console.log(chunk, offset, totalSize, fileName)

//     const filePath = `./uploads/${fileName}`;
//     const writableStream = fs.createWriteStream(filePath, { flags: 'a' });

//     writableStream.write(chunk);

//     res.set('x-next-offset', parseInt(offset) + chunk.length);

//     if (parseInt(offset) + chunk.length >= parseInt(totalSize)) {
//         res.sendStatus(200);
//     } else {
//         res.sendStatus(206);
//     }
// })


const PORT = 4001 || env.PORT
app.listen(PORT, ()=>{
    console.log(`App is running in port :: ${PORT}`)
})

//exit on uncaught errors
process.on('uncaughtException', error => {
    console.log(`There was an uncaught error: ${error}`);
    process.exit(1);
})