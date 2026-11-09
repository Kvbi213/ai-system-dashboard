process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import dotenv from 'dotenv';
dotenv.config();

import { PushbulletListener } from './pushbullet/websocketListener.js';
import { PushbulletDispatcher } from './pushbullet/dispatcher.js';
import { SystemScheduler } from './cron/scheduler.js';
import { MailScanner } from './triage/mailScanner.js';
import { PushNotificationAggregator } from './triage/pushNotificationAggregator.js';
import { logDrain } from './telemetry/logDrain.js';

export { logDrain, MailScanner, PushNotificationAggregator };

const PUSHBULLET_API_KEY = process.env.PUSHBULLET_API_KEY || '';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:5000/api';

console.log('[*] INFO :: Uruchamianie daemona OmniDash Background Worker v4.0.0...');

const pushAggregator = new PushNotificationAggregator();
const mailScanner = new MailScanner();
const dispatcher = new PushbulletDispatcher(PUSHBULLET_API_KEY);
const listener = new PushbulletListener(PUSHBULLET_API_KEY, API_GATEWAY_URL, pushAggregator);
const scheduler = new SystemScheduler(API_GATEWAY_URL, dispatcher, mailScanner, pushAggregator);

dispatcher.start();
listener.start();
scheduler.start();

const shutdown = () => {
  console.log('[*] INFO :: Zatrzymywanie procesów tła...');
  dispatcher.stop();
  listener.stop();
  scheduler.stop();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
