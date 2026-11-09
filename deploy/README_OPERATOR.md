# OmniDash Production Stack (kevin183)

## Status gałęzi Git:
Repozytorium `/data/OpenBot/Shared/ai-system-dashboard` znajduje się na gałęzi `mikr.us` i zawiera najnowszy commit:
`79c5ef1 fix(scheduler): enforce Europe/Warsaw timezone for Pushbullet morning briefing and lesson alarms`

## Jak zaktualizować działający kontener OmniDash na Mikrusie:
W głównym terminalu roota na serwerze Mikrus (gdzie dostępny jest demon Dockera):

```bash
cd /data/OpenBot/Shared/ai-system-dashboard
./deploy/mikrus-deploy.sh
```
Skrypt automatycznie:
1. Zweryfikuje plik `.env`
2. Zbuduje obrazy z najnowszego kodu gałęzi `mikr.us`
3. Zrestartuje kontenery (`omnidash-web`, `omnidash-api`, `omnidash-worker`, `omnidash-redis`)
4. Sprawdzi health-check API na porcie 5000.
