const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const postRequest = async (path: string, data: any) => {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const text = await res.text();
        let jsonData: any = {};
        try {
            jsonData = text ? JSON.parse(text) : {};
        } catch(e) {
            console.log('failed to parse response:', text);
            return { error: true, message: 'bad response from server' };
        }
        
        if (!res.ok) {
            console.log('api error:', res.status, path, jsonData);
            return { 
                error: true, 
                status: res.status,
                message: jsonData.message || 'request failed (' + res.status + ')',
                ...jsonData 
            };
        }
        return jsonData;
    } catch (err) {
        console.log('network error on POST', path, err);
        return { error: true, message: 'Network error - is the backend running?' };
    }
};

export function getRequest(path: string) {
    return fetch(`${API_URL}${path}`)
        .then(res => {
            if (!res.ok) return null;
            return res.text().then(t => t ? JSON.parse(t) : null);
        })
        .catch(err => {
            console.log('GET error:', path, err);
            return null;
        });
}
