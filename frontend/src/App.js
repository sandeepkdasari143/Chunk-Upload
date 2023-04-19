import React from 'react';
import { Upload } from "@progress/kendo-react-upload";

function App() {
  const chunkAndUpload = async (files, options, onProgress) => {
    const currentFile = files[0];
    const file = files[0].getRawFile();

    const CHUNK_SIZE = 100 * 1024 *1024; // 100 MB

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    console.log(totalChunks)

    let offset = 0;

    const onSavePromiseRequest = new Promise(async (resolve, reject) => { 
      
      for(let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++){
        const start = offset;
        const end = Math.min(offset + CHUNK_SIZE, file.size);

        console.log(start, end, offset)

        let chunk = file.slice(start, end);

        const uploadChunk = async (e)=>{
          chunk = e.target.result;
          const params = new URLSearchParams();
          params.set('name', file.name);
          params.set('size', file.size);
          params.set('currentChunkIndex', chunkIndex);
          params.set('totalChunks', totalChunks)
          params.set('CHUNK_SIZE', end-start);
          params.set('offset', offset);
          console.log(params.toString());
          try {
            const URL = `http://localhost:4001/upload?${params.toString()}`;
            const OPTIONS = {
              method: "POST",
              headers: {
                'Content-Type': 'application/octet-stream'
              },
              body: chunk,
            }
            const chunkUploadRequest = new Request(URL, OPTIONS);
            const response = await fetch(chunkUploadRequest);
  
            if (response.status === 200) {
              resolve(currentFile.uid)
            } 
            else {
              offset = parseInt(response.headers['x-next-offset']);
              console.log(offset)
            }
          } catch (err) {
            reject(currentFile.uid)
            return;
          }
        }
        
        const reader = new FileReader();
        reader.onload = async(e) => uploadChunk(e);
        reader.readAsDataURL(chunk);

        
    
        // const chunkFormData = new FormData();
        // const chunkBuffer = await chunk.arrayBuffer();
        // chunkFormData.append('chunk', chunkBuffer.toString());
        // chunkFormData.append('offset', start.toString());
        // chunkFormData.append('totalSize', file.size.toString());
        // chunkFormData.append('fileName', file.name);
      }
    }); 

    return onSavePromiseRequest;
  };

  return (
    <div className="App">
      <Upload
        batch={false}
        multiple={true}
        defaultFiles={[]}
        withCredentials={false}
        saveUrl={chunkAndUpload}
      />
    </div>
  );
}



export default App;
