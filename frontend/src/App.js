import React from 'react';
import { Upload } from "@progress/kendo-react-upload";

function App() {
  const chunkAndUpload = async (files, options, onProgress) => {
    const currentFile = files[0];
    const file = files[0].getRawFile();

    const CHUNK_SIZE = 100 * 1024 *1024; // 100 MB

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    // console.log(totalChunks)


    const onSavePromiseRequest = new Promise(async (resolve, reject) => { 
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++){
        
        let start = chunkIndex * CHUNK_SIZE;
        let end = start + CHUNK_SIZE;

        let chunk = file.slice(start, end);

        const uploadChunk = async (e)=>{
          chunk = e.target.result;
          console.log("Each Chunk Size: ",chunk.length/(1024 *1024))
          const params = new URLSearchParams();
          params.set('name', file.name);
          params.set('currentChunkIndex', chunkIndex);
          params.set('totalChunks', totalChunks)
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
            const response = await fetch(chunkUploadRequest) ;
            
            if (response.status === 200) {
              const json = await response.json();
              console.log("Uploaded File Name: ",json.finalFileName);
              resolve(currentFile.uid)
            }
          } catch (err) {
            console.log("Fetch Failed: Rejecting the File Upload...",err);
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
