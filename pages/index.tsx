import type { NextPage } from "next";
import { useState } from "react";
// Remove the Thirdweb import completely

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{ cid: string, url: string } | null>(null);

  const uploadToIpfs = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Call your custom API route (which uses NFT.Storage)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: file, // Send file directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      console.log('Upload URL: ', result.url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Upload to IPFS (NFT.Storage)</h1>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files) {
            setFile(e.target.files[0]);
          }
        }}
      />

      <button onClick={uploadToIpfs} disabled={uploading || !file}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}

      {uploadResult && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8f0' }}>
          <h3>Upload Successful!</h3>
          <p><strong>CID:</strong> {uploadResult.cid}</p>
          <p><strong>URL:</strong> <a href={uploadResult.url} target="_blank">{uploadResult.url}</a></p>
          <img src={uploadResult.url} alt="Uploaded" style={{ maxWidth: '300px', marginTop: '10px' }} />
        </div>
      )}
    </div>
  );
};

export default Home;