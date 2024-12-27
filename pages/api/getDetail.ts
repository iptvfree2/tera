import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Claves directamente en el código (no recomendado para producción)
    const dpLogId = "59350200172865410009";
    const jsToken = "3D1900FFEDE22A36D2E6D36ABAAE9CEB74926E292F0986A22DEF1DA25812774556754CAACE1AD4C44240AB83098E4DDC9DAA210A461D3A837D60301AEBC78DFD";
    const appId = "250528";

    const userAgent = req.headers['user-agent'];

    if (req.method !== 'POST') {
        res.status(405).json({ result: false, message: 'Method not allowed' });
        return;
    }

    const url = req.body.url;
    if (typeof url !== 'string' || url.trim() === '') {
        res.status(400).json({ result: false, message: 'Invalid URL parameter' });
        return;
    }

    const allowedHostname = [
        "www.terabox.com",
        "terabox.com",
        "www.teraboxapp.com",
        "teraboxapp.com",
        "1024tera.com",
        "www.1024tera.com"
    ];

    try {
        const urlData = new URL(url);

        if (!allowedHostname.includes(urlData.hostname)) {
            throw new Error('Not a valid hostname');
        }

        const shareCode = urlData.pathname.split('/').slice(-1)[0];
        if (!shareCode || shareCode[0] !== '1') {
            throw new Error('Not a valid share code');
        }

        const axiosClient = axios.create({
            headers: {
                'User-Agent': userAgent,
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': url,
            },
        });

        const response = await axiosClient.get(
            `https://www.terabox.com/api/shorturlinfo?app_id=${appId}&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&dp-logid=${dpLogId}&shorturl=${shareCode}&root=1`
        );

        if (response.data.errno !== 0) {
            throw new Error(`API Error: ${response.data.errmsg || 'Unknown error'}`);
        }

        res.status(200).json({
            result: true,
            data: {
                shareid: response.data.shareid,
                uk: response.data.uk,
                sign: response.data.sign,
                timestamp: response.data.timestamp,
                list: response.data.list.map((fid: any) => ({
                    fs_id: fid.fs_id,
                    filename: fid.server_filename,
                    size: fid.size,
                })),
            },
        });
    } catch (error: any) {
        res.status(400).json({ result: false, message: error.message });
    }
}
