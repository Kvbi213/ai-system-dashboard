import axios from 'axios';
import crypto from 'crypto';
import dns from 'dns/promises';

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

export const performOSINTScan = async (rawTarget) => {
  const { type, value: target } = detectTargetType(rawTarget);
  const results = { target_type: type, target_value: target };

  try {
    if (type === 'ip' || type === 'domain') {
      let ipToScan = target;
      
      // Rozwi�zywanie IP dla domeny
      if (type === 'domain') {
        try {
          const addresses = await dns.resolve4(target);
          if (addresses && addresses.length > 0) {
            ipToScan = addresses[0];
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
