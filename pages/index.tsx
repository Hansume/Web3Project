import type { NextPage } from "next";
import { useState } from "react";

type UploadResult = {
  imageCid: string
  imageUrl: string
  metadataCid: string
  metadataUrl: string
  metadata: any
}

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [imageError, setImageError] = useState(false);

  const uploadToIpfs = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setImageError(false);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      console.log('Upload completed:', result);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>Upload Image & Create ERC-721 Metadata</h1>

      <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
              setUploadResult(null);
              setError(null);
              setImageError(false);
            }
          }}
          style={{ marginBottom: '10px' }}
        />

        <br />

        <button
          onClick={uploadToIpfs}
          disabled={uploading || !file}
          style={{
            padding: '12px 24px',
            backgroundColor: uploading || !file ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: uploading || !file ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload & Create NFT Metadata'}
        </button>
      </div>

      {error && (
        <div style={{
          color: '#d32f2f',
          padding: '15px',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {uploadResult && (
        <div>
          {/* Image Section */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#2e7d32', marginTop: '0' }}>🖼️ Image Upload Results</h3>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#333', margin: '8px 0' }}>
                <strong>Image CID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', marginLeft: '8px' }}>
                  {uploadResult.imageCid}
                </span>
              </p>
              <p style={{ color: '#333', margin: '8px 0' }}>
                <strong>Image URL:</strong>
                <a href={uploadResult.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', marginLeft: '8px' }}>
                  {uploadResult.imageUrl}
                </a>
              </p>
            </div>

            <div style={{ marginTop: '15px' }}>
              <strong style={{ color: '#333' }}>Image Preview:</strong>
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                {!imageError ? (
                  <img
                    src={uploadResult.imageUrl}
                    alt="Uploaded NFT"
                    style={{
                      maxWidth: '400px',
                      maxHeight: '400px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                    onError={() => {
                      console.log('Image failed to load, trying alternative URLs...');
                      setImageError(true);
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                    }}
                  />
                ) : (
                  <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', color: '#666' }}>
                    <p>⏳ Image is still being processed on IPFS. Try these alternative links:</p>
                    <div style={{ marginTop: '10px' }}>
                      <a href={`https://ipfs.io/ipfs/${uploadResult.imageCid}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', display: 'block', margin: '5px 0' }}>
                        https://ipfs.io/ipfs/{uploadResult.imageCid}
                      </a>
                      <a href={`https://cloudflare-ipfs.com/ipfs/${uploadResult.imageCid}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', display: 'block', margin: '5px 0' }}>
                        https://cloudflare-ipfs.com/ipfs/{uploadResult.imageCid}
                      </a>
                    </div>
                    <button
                      onClick={() => setImageError(false)}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Retry Loading Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#1565c0', marginTop: '0' }}>📋 ERC-721 Metadata</h3>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ color: '#333', margin: '8px 0' }}>
                <strong>Metadata CID:</strong>
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px', marginLeft: '8px' }}>
                  {uploadResult.metadataCid}
                </span>
              </p>
              <p style={{ color: '#333', margin: '8px 0' }}>
                <strong>Metadata URL:</strong>
                <a href={uploadResult.metadataUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', marginLeft: '8px' }}>
                  {uploadResult.metadataUrl}
                </a>
              </p>
            </div>

            <details style={{ marginTop: '15px' }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#333',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}>
                📄 View Metadata JSON (Click to expand)
              </summary>
              <pre style={{
                backgroundColor: '#2d3748',
                color: '#e2e8f0',
                padding: '20px',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '14px',
                marginTop: '10px',
                border: '1px solid #4a5568',
                lineHeight: '1.5'
              }}>
                {JSON.stringify(uploadResult.metadata, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;