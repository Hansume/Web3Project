import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
    api: {
        bodyParser: false,
    },
}

type Data = {
    cid?: string
    url?: string
    error?: string
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
        // Read the uploaded file
        const chunks = []
        for await (const chunk of req) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)

        if (buffer.length === 0) {
            return res.status(400).json({ error: 'No file data received' })
        }

        // Create FormData for Pinata API
        const formData = new FormData()
        const blob = new Blob([buffer])
        formData.append('file', blob, 'upload')
        
        // Optional: Add metadata
        const metadata = JSON.stringify({
            name: `upload-${Date.now()}`,
        })
        formData.append('pinataMetadata', metadata)

        // Upload directly to Pinata API
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': apiSecret,
            },
            body: formData
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Pinata API error:', errorData)
            throw new Error(`Pinata API error: ${JSON.stringify(errorData)}`)
        }

        const result = await response.json()
        const cid = result.IpfsHash
        const url = `https://gateway.pinata.cloud/ipfs/${cid}`

        console.log('✅ Upload successful!')
        console.log('CID:', cid)
        console.log('URL:', url)

        return res.status(200).json({ cid, url })

    } catch (error: any) {
        console.error('❌ Upload error:', error)
        return res.status(500).json({
            error: `Upload failed: ${error.message}`
        })
    }
}