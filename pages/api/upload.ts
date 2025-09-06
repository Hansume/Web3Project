import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
    api: {
        bodyParser: false,
        responseLimit: '10mb',
    },
}

type Data = {
    imageCid?: string
    imageUrl?: string
    metadataCid?: string
    metadataUrl?: string
    metadata?: any
    error?: string
}

// Helper function for fetch with timeout and retry
async function fetchWithRetry(url: string, options: any, retries = 3, timeout = 30000): Promise<Response> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1}/${retries} - Uploading to: ${url}`)

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout)

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            return response // Successfully got a response

        } catch (error: any) {
            lastError = error
            console.log(`Attempt ${i + 1} failed:`, error.message)

            if (i === retries - 1) {
                // This was the last attempt, throw the error
                throw new Error(`All ${retries} attempts failed. Last error: ${error.message}`)
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, i) * 1000
            console.log(`Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    // This should never be reached, but TypeScript wants it
    throw new Error(`Unexpected error in fetchWithRetry: ${lastError?.message}`)
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const apiKey = process.env.PINATA_API_KEY
    const apiSecret = process.env.PINATA_SECRET_API_KEY

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Pinata credentials not configured' })
    }

    try {
        // Step 1: Read the uploaded file
        console.log('📁 Reading file data...')
        const chunks = []
        for await (const chunk of req) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        console.log(`📦 Buffer size: ${buffer.length} bytes`)

        if (buffer.length === 0) {
            return res.status(400).json({ error: 'No file data received' })
        }

        // Step 2: Upload the image to IPFS with retry logic
        console.log('📷 Uploading image to IPFS...')
        const imageFormData = new FormData()
        const imageBlob = new Blob([buffer], { type: 'image/*' })
        const fileName = `image-${Date.now()}`
        imageFormData.append('file', imageBlob, fileName)

        const imageMetadata = JSON.stringify({
            name: fileName,
        })
        imageFormData.append('pinataMetadata', imageMetadata)

        const imageResponse = await fetchWithRetry(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            {
                method: 'POST',
                headers: {
                    'pinata_api_key': apiKey,
                    'pinata_secret_api_key': apiSecret,
                },
                body: imageFormData
            },
            3, // 3 retries
            30000 // 30 second timeout
        )

        if (!imageResponse.ok) {
            const errorData = await imageResponse.json()
            console.error('Image upload error:', errorData)
            throw new Error(`Image upload failed: ${JSON.stringify(errorData)}`)
        }

        const imageResult = await imageResponse.json()
        const imageCid = imageResult.IpfsHash
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCid}`

        console.log('✅ Image uploaded successfully!')
        console.log('Image CID:', imageCid)

        // Step 3: Create ERC-721 metadata
        const metadata = {
            name: fileName,
            description: `NFT image uploaded on ${new Date().toISOString()}`,
            image: `ipfs://${imageCid}`,
            external_url: imageUrl,
            attributes: [
                {
                    trait_type: "Upload Date",
                    value: new Date().toLocaleDateString()
                },
                {
                    trait_type: "File Size",
                    value: `${buffer.length} bytes`
                },
                {
                    trait_type: "CID",
                    value: imageCid
                }
            ],
            properties: {
                files: [
                    {
                        uri: `ipfs://${imageCid}`,
                        type: "image",
                        cdn: true
                    }
                ],
                category: "image"
            }
        }

        console.log('📋 Creating ERC-721 metadata...')

        // Step 4: Upload metadata JSON to IPFS with retry logic
        const metadataFormData = new FormData()
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: 'application/json'
        })
        metadataFormData.append('file', metadataBlob, `${fileName}-metadata.json`)

        const jsonMetadata = JSON.stringify({
            name: `${fileName}-metadata.json`,
        })
        metadataFormData.append('pinataMetadata', jsonMetadata)

        const metadataResponse = await fetchWithRetry(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            {
                method: 'POST',
                headers: {
                    'pinata_api_key': apiKey,
                    'pinata_secret_api_key': apiSecret,
                },
                body: metadataFormData
            },
            3, // 3 retries
            30000 // 30 second timeout
        )

        if (!metadataResponse.ok) {
            const errorData = await metadataResponse.json()
            console.error('Metadata upload error:', errorData)
            throw new Error(`Metadata upload failed: ${JSON.stringify(errorData)}`)
        }

        const metadataResult = await metadataResponse.json()
        const metadataCid = metadataResult.IpfsHash
        const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCid}`

        console.log('✅ Metadata uploaded successfully!')
        console.log('Metadata CID:', metadataCid)

        return res.status(200).json({
            imageCid,
            imageUrl,
            metadataCid,
            metadataUrl,
            metadata
        })

    } catch (error: any) {
        console.error('❌ Upload error:', error)
        return res.status(500).json({
            error: `Upload failed: ${error.message}`
        })
    }
}