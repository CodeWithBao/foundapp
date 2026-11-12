import { useEffect, useState } from 'react';
import { getAuthToken } from '../../services/apiClient';

function EvidenceImage({ url, index }) {
  const [state, setState] = useState({ url: '', error: '' });
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl;
    let cancelled = false;
    (async () => {
      try {
        // Only send credentials to the known same-origin private upload route.
        if (!/^\/api\/v1\/uploads\/[a-f0-9]{32}$/i.test(url)) throw new Error('Ảnh cũ không phải tệp riêng tư được hỗ trợ.');
        const token = getAuthToken();
        const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`Không thể tải ảnh bằng chứng (${response.status}).`);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Dữ liệu ảnh không hợp lệ.');
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, error: '' });
      } catch (error) {
        if (!cancelled) setState({ url: '', error: error.message });
      }
    })();
    return () => { cancelled = true; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url]);
  return <div className="min-w-0">{state.url ? <a href={state.url} target="_blank" rel="noreferrer" className="block rounded-lg p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8F1822]" aria-label={`Xem ảnh bàn giao ${index + 1} trong thẻ mới`}><img src={state.url} alt={`Bằng chứng bàn giao ${index + 1}`} className="w-full h-24 object-contain rounded-lg bg-slate-50" /></a> : <p className="text-xs text-slate-600" role="status">{state.error || 'Đang tải ảnh…'}</p>}</div>;
}

export default function HandoverEvidence({ images = [] }) {
  return images.length ? <div className="grid grid-cols-2 gap-2 mt-2">{images.map((url, index) => <EvidenceImage key={`${url}-${index}`} url={url} index={index} />)}</div> : null;
}
