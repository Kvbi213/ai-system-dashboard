import crypto from 'node:crypto';
import dns from 'node:dns/promises';

export const config = {
  maxDuration: 20,
};

const detectTargetType = (target) => {
  const input = target.trim();
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
  const domainRegex = /\b[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}\b/;
  const macRegex = /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/;
  const emailRegex = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;

  if (ipRegex.test(input)) return { type: 'ip', value: input.match(ipRegex)[0] };
  if (domainRegex.test(input)) return { type: 'domain', value: input.match(domainRegex)[0] };
  if (macRegex.test(input)) return { type: 'mac', value: input.match(macRegex)[0] };
  if (emailRegex.test(input)) return { type: 'email', value: input.match(emailRegex)[0] };
  return { type: 'string', value: input };
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 4000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    return null;
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawTarget = req.body?.target || req.query?.target;
  if (!rawTarget || typeof rawTarget !== 'string' || !rawTarget.trim()) {
    return res.status(400).json({ error: 'Brak podanego celu (target).' });
  }

  const { type, value: target } = detectTargetType(rawTarget);
  const results = { target_type: type, target_value: target };

  try {
    if (type === 'ip' || type === 'domain') {
      let ipToScan = target;

      // 1. Rozwiązywanie adresu IP dla domeny
      if (type === 'domain') {
        try {
          const addresses = await dns.resolve4(target);
          if (addresses && addresses.length > 0) {
            ipToScan = addresses[0];
            results.resolved_ip = ipToScan;
          }
        } catch (e) {
          // Fallback przez Google DNS API
          try {
            const googleDns = await fetchWithTimeout(`https://dns.google/resolve?name=${encodeURIComponent(target)}&type=A`, {}, 3000);
            if (googleDns && googleDns.ok) {
              const dnsJson = await googleDns.json();
              if (dnsJson.Answer && dnsJson.Answer.length > 0) {
                const aRecord = dnsJson.Answer.find(a => a.type === 1);
                if (aRecord && aRecord.data) {
                  ipToScan = aRecord.data;
                  results.resolved_ip = ipToScan;
                }
              }
            }
          } catch {}
        }
      }

      // 2. GeoJS (Geolokalizacja)
      if (ipToScan) {
        try {
          const geoRes = await fetchWithTimeout(`https://get.geojs.io/v1/ip/geo/${ipToScan}.json`, {}, 4000);
          if (geoRes && geoRes.ok) {
            results.geo = await geoRes.json();
          }
        } catch {}
      }

      // 3. Wayback Machine
      if (type === 'domain') {
        try {
          const wbRes = await fetchWithTimeout(`https://archive.org/wayback/available?url=${encodeURIComponent(target)}`, {}, 4000);
          if (wbRes && wbRes.ok) {
            results.wayback = await wbRes.json();
          }
        } catch {}
      }

      // 4. WHOIS (NetworkCalc lub HackerTarget)
      try {
        const whoisRes = await fetchWithTimeout(`https://networkcalc.com/api/dns/whois/${encodeURIComponent(target)}`, {}, 4000);
        if (whoisRes && whoisRes.ok) {
          const whoisJson = await whoisRes.json();
          if (whoisJson && whoisJson.status === 'OK' && whoisJson.whois) {
            results.whois = JSON.stringify(whoisJson.whois, null, 2);
          }
        }
      } catch {}

      if (!results.whois) {
        try {
          const htWhois = await fetchWithTimeout(`https://api.hackertarget.com/whois/?q=${encodeURIComponent(target)}`, {}, 4000);
          if (htWhois && htWhois.ok) {
            const htText = await htWhois.text();
            if (htText && !htText.startsWith('error')) {
              results.whois = htText;
            }
          }
        } catch {}
      }

      // 5. Rekordy DNS (HackerTarget)
      if (type === 'domain') {
        try {
          const htDns = await fetchWithTimeout(`https://api.hackertarget.com/dnslookup/?q=${encodeURIComponent(target)}`, {}, 4000);
          if (htDns && htDns.ok) {
            const dnsText = await htDns.text();
            if (dnsText && !dnsText.startsWith('error')) {
              results.dns = dnsText;
            }
          }
        } catch {}
      }
    }

    // 6. Sprawdzenie wycieków haseł (HaveIBeenPwned Range API)
    if (type === 'string' || type === 'email') {
      if (type === 'string') {
        try {
          const hash = crypto.createHash('sha1').update(target).digest('hex').toUpperCase();
          const prefix = hash.slice(0, 5);
          const suffix = hash.slice(5);
          const hibpRes = await fetchWithTimeout(`https://api.pwnedpasswords.com/range/${prefix}`, {}, 4000);
          if (hibpRes && hibpRes.ok) {
            const hibpText = await hibpRes.text();
            const lines = hibpText.split('\n');
            results.hibp = 0;
            for (const line of lines) {
              const [hashSuffix, count] = line.split(':');
              if (hashSuffix && hashSuffix.trim() === suffix) {
                results.hibp = parseInt(count.trim(), 10);
                break;
              }
            }
          }
        } catch {}
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Błąd podczas wykonywania skanu OSINT: ' + error.message });
  }
}
