import axios from 'axios';
import crypto from 'crypto';
import dns from 'dns/promises';

export const detectTargetType = (target) => {
  const input = target.trim();
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
  const macRegex = /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/;
  const domainRegex = /\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/;

  if (emailRegex.test(input)) return { type: 'email', value: input.match(emailRegex)[0] };
  if (ipRegex.test(input)) return { type: 'ip', value: input.match(ipRegex)[0] };
  if (macRegex.test(input)) return { type: 'mac', value: input.match(macRegex)[0] };
  if (domainRegex.test(input)) return { type: 'domain', value: input.match(domainRegex)[0] };
  return { type: 'string', value: input };
};

export const isPrivateOrReservedIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  let clean = ip.trim().toLowerCase();

  // Obsługa IPv4-mapped IPv6 (np. ::ffff:127.0.0.1, ::ffff:192.168.1.1)
  if (clean.startsWith('::ffff:')) {
    clean = clean.replace('::ffff:', '');
  }

  // Loopback (127.0.0.0/8, ::1, localhost)
  if (clean === 'localhost' || clean === '127.0.0.1' || /^127\./.test(clean) || clean === '::1') return true;
  // Bieżąca sieć / nieokreślona (0.0.0.0/8)
  if (/^0\./.test(clean) || clean === '0.0.0.0' || clean === '::') return true;
  // RFC 1918 Private ranges
  if (/^10\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  if (/^192\.168\./.test(clean)) return true;
  // Link-local / Cloud metadata (169.254.0.0/16)
  if (/^169\.254\./.test(clean)) return true;
  
  // IPv6 ULA (fc00::/7 - pokrywa zakresy fc.. oraz fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(clean) || clean.startsWith('fc00:') || clean.startsWith('fd00:')) return true;
  // IPv6 Link-Local (fe80::/10 - zakres fe80.. do febf..)
  if (/^fe[89ab][0-9a-f]:/i.test(clean) || clean.startsWith('fe80:')) return true;

  return false;
};

export const performOSINTScan = async (rawTarget) => {
  const { type, value: target } = detectTargetType(rawTarget);
  const results = { target_type: type, target_value: target };

  if (type === 'ip' && isPrivateOrReservedIP(target)) {
    return {
      target_type: type,
      target_value: target,
      blocked: true,
      error: 'Odmowa skanowania: adres IP prywatny lub zarezerwowany (blokada SSRF).'
    };
  }

  try {
    if (type === 'ip' || type === 'domain') {
      let ipToScan = target;
      
      // Rozwiązywanie IP dla domeny (weryfikacja WSZYSTKICH zwróconych adresów IPv4 i IPv6)
      if (type === 'domain') {
        try {
          const addresses4 = await dns.resolve4(target).catch(() => []);
          const addresses6 = await dns.resolve6(target).catch(() => []);
          const allAddresses = [...addresses4, ...addresses6];

          if (allAddresses.length > 0) {
            const privateAddress = allAddresses.find(addr => isPrivateOrReservedIP(addr));
            if (privateAddress) {
              results.blocked = true;
              results.resolved_ip = privateAddress;
              results.error = `Odmowa skanowania: domena wskazuje na prywatny/zarezerwowany adres sieciowy (${privateAddress}) (blokada SSRF).`;
              return results;
            }
            ipToScan = addresses4[0] || addresses6[0];
            results.resolved_ip = ipToScan;
          }
        } catch (e) { console.error("DNS Resolve Error", e); }
      }

      // GeoJS
      if (ipToScan) {
        try {
          const geoRes = await axios.get(`https://get.geojs.io/v1/ip/geo/${ipToScan}.json`, { timeout: 5000 });
          results.geo = geoRes.data;
        } catch (err) {}
      }

      // Wayback Machine
      if (type === 'domain') {
        try {
          const wbRes = await axios.get(`http://archive.org/wayback/available?url=${target}`, { timeout: 5000 });
          results.wayback = wbRes.data;
        } catch (err) {}
      }

      // WHOIS (NetworkCalc lub HackerTarget)
      try {
        const whoisRes = await axios.get(`https://networkcalc.com/api/dns/whois/${target}`, { timeout: 5000 });
        if (whoisRes.data && whoisRes.data.status === 'OK' && whoisRes.data.whois) {
          results.whois = JSON.stringify(whoisRes.data.whois, null, 2);
        } else {
          const htWhois = await axios.get(`https://api.hackertarget.com/whois/?q=${target}`, { timeout: 5000 });
          if (typeof htWhois.data === 'string' && !htWhois.data.startsWith('error')) {
            results.whois = htWhois.data;
          }
        }
      } catch (err) {}

      // HackerTarget (DNS)
      if (type === 'domain') {
         try {
           const htDns = await axios.get(`https://api.hackertarget.com/dnslookup/?q=${target}`, { timeout: 5000 });
           if (typeof htDns.data === 'string' && !htDns.data.startsWith('error')) {
             results.dns = htDns.data;
           }
         } catch (err) {}
      }
    }

    if (type === 'string' || type === 'email') {
      if (type === 'string') {
        try {
          const hash = crypto.createHash('sha1').update(target).digest('hex').toUpperCase();
          const prefix = hash.slice(0, 5);
          const suffix = hash.slice(5);
          const hibpRes = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, { timeout: 5000 });
          const lines = hibpRes.data.split('\n');
          results.hibp = 0;
          for (let line of lines) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix.trim() === suffix) {
              results.hibp = parseInt(count.trim(), 10);
              break;
            }
          }
        } catch (err) {}
      }
    }
    
    return results;
  } catch (error) {
    return { error: 'B��d podczas wykonywania skanu: ' + error.message };
  }
};
