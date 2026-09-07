import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';

export interface BcvRate {
  source: 'BCV';
  usd: number;
  eur: number;
  cop: number;
  brl: number;
  fetchedAt: string;
  isStale: boolean;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private cachedRate: BcvRate | null = null;
  private lastFetch: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;
  private memoryHistory: { rate: number, createdAt: string }[] = [];

  async getBcvRate(): Promise<BcvRate> {
    const now = new Date();
    const isStale = !this.lastFetch || (now.getTime() - this.lastFetch.getTime()) > this.CACHE_TTL_MS;

    if (!isStale && this.cachedRate) {
      return { ...this.cachedRate, isStale: false };
    }

    // Estrategia 1: API pydolarve (fuente externa confiable para Venezuela)
    try {
      const usd = await this.fetchFromPydolarve();
      if (usd > 0) {
        this.logger.log('BCV Rate from pydolarve API: ' + usd);
        return this.saveRate(usd, now);
      }
    } catch (err) {
      this.logger.warn('pydolarve failed: ' + err.message);
    }

    // Estrategia 2: API ExchangeRate.host (USD -> VES)
    try {
      const usd = await this.fetchFromExchangeRateHost();
      if (usd > 0) {
        this.logger.log('BCV Rate from exchangerate.host: ' + usd);
        return this.saveRate(usd, now);
      }
    } catch (err) {
      this.logger.warn('exchangerate.host failed: ' + err.message);
    }

    // Estrategia 3: Scraping directo bcv.org.ve
    try {
      const usd = await this.scrapeBcv();
      if (usd > 0) {
        this.logger.log('BCV Rate from direct scrape: ' + usd);
        return this.saveRate(usd, now);
      }
    } catch (err) {
      this.logger.warn('BCV direct scrape failed: ' + err.message);
    }

    // Fallback: ultimo valor en cache o valor de referencia
    if (this.cachedRate) return { ...this.cachedRate, isStale: true };

    return {
      source: 'BCV',
      usd: 36.68,
      eur: 40.50,
      cop: 0.009,
      brl: 6.80,
      fetchedAt: now.toISOString(),
      isStale: true,
    };
  }

  private saveRate(usd: number, now: Date): BcvRate {
    this.cachedRate = {
      source: 'BCV',
      usd,
      eur: 0,
      cop: 0,
      brl: 0,
      fetchedAt: now.toISOString(),
      isStale: false,
    };
    this.lastFetch = now;
    const lastInHistory = this.memoryHistory[this.memoryHistory.length - 1];
    if (!lastInHistory || lastInHistory.rate !== usd) {
      this.memoryHistory.push({ rate: usd, createdAt: now.toISOString() });
      if (this.memoryHistory.length > 48) this.memoryHistory.shift();
    }
    return this.cachedRate;
  }

  private fetchFromPydolarve(): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = https.get({
        host: 'pydolarve.org',
        path: '/api/v1/dollar?monitor=bcv',
        rejectUnauthorized: false,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        timeout: 8000,
      }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            // Response: { price: 36.68, ... }
            const val = parseFloat(json.price || json.last_update || 0);
            resolve(isNaN(val) ? 0 : val);
          } catch {
            resolve(0);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  private fetchFromExchangeRateHost(): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = https.get({
        host: 'api.exchangerate-api.com',
        path: '/v4/latest/USD',
        rejectUnauthorized: false,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        timeout: 8000,
      }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            // Response: { rates: { VES: 36.68 } }
            const val = parseFloat(json.rates && json.rates.VES ? json.rates.VES : 0);
            resolve(isNaN(val) || val < 1 ? 0 : val);
          } catch {
            resolve(0);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  private scrapeBcv(): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = https.get({
        host: 'www.bcv.org.ve',
        path: '/',
        rejectUnauthorized: false,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000,
      }, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          const match = body.match(/dollar.*?<strong.*?>(.*?)<\/strong>/is);
          if (match) {
            const raw = match[1].trim().replace(',', '.');
            const val = parseFloat(raw);
            resolve(isNaN(val) ? 0 : val);
          } else {
            resolve(0);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  async getRateHistory(limit = 48): Promise<any[]> {
    return [...this.memoryHistory].reverse().slice(0, limit);
  }
}
