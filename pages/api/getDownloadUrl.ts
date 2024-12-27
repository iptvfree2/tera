import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import qs from 'qs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userAgent = req.headers['user-agent'];

    // Configuración del cliente Axios
    const axiosClient = axios.create({
        headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.terabox.com/sharing/link?surl=gfujeeyKv_ZGFd_dAJ3uXw',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        },
        maxRedirects: 0,
    });

    // Parámetros de la API
    const dpLogId = "59350200172865410009";
    const jsToken = "3D1900FFEDE22A36D2E6D36ABAAE9CEB74926E292F0986A22DEF1DA25812774556754CAACE1AD4C44240AB83098E4DDC9DAA210A461D3A837D60301AEBC78DFD";
    const appId = "250528";

    const { fid, shareid: shareId, sign, uk, timestamp } = req.body;

    try {
        // Validación de parámetros
        if (!fid || !shareId || !sign || !uk || !timestamp) {
            throw new Error(`Missing required parameters: fid, shareId, sign, uk, or timestamp`);
        }

        // Obtener enlace de descarga desde Terabox
        const downloadResponse = await axiosClient.post(
            `https://www.terabox.com/share/download?app_id=${appId}&web=1&channel=dubox&clienttype=0&jsToken=${jsToken}&dp-logid=${dpLogId}&shareid=${shareId}&sign=${sign}&timestamp=${timestamp}`,
            qs.stringify({ product: 'share', nozip: 0, fid_list: `[${fid}]`, uk, primaryid: shareId }),
            { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
        );

        if (downloadResponse.data.errno !== 0) {
            throw new Error(`API Error: ${downloadResponse.data.errno}`);
        }

        const dlink = downloadResponse.data.dlink;

        // Obtener URL redirigida
        const redirectResponse = await axiosClient.get(dlink, {
            validateStatus: (status) => status === 302 || (status >= 200 && status < 300),
        });

        if (redirectResponse.status !== 302) {
            throw new Error('Failed to fetch download URL');
        }

        const urlDownload = redirectResponse.headers.location;

        // Respuesta exitosa
        res.status(200).json({ result: true, data: urlDownload });
    } catch (error: any) {
        res.status(400).json({ result: false, message: error.message });
    }
}
