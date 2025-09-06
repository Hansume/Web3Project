import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const apiKey = process.env.PINATA_API_KEY
    const apiSecret = process.env.PINATA_SECRET_API_KEY

    if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Pinata credentials not configured' })
    }

    try {
        console.log('Testing Pinata authentication...')

        const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
            method: 'GET',
            headers: {
                'pinata_api_key': apiKey,
                'pinata_secret_api_key': apiSecret,
            },
        })

        console.log('Response status:', response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Pinata test error:', errorText)
            return res.status(response.status).json({ error: errorText })
        }

        const result = await response.json()
        console.log('Pinata test result:', result)

        return res.status(200).json({
            success: true,
            message: 'Pinata connection successful!',
            result
        })

    } catch (error: any) {
        console.error('Pinata test failed:', error)
        return res.status(500).json({
            error: `Connection failed: ${error.message}`
        })
    }
}