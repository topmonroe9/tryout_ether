import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

@Injectable()
export class WSClientService {

  // wss://echo.websocket.org is a test websocket server
  private _ws;
  private _ETHUSDT;
  private _ETHEUR;

  constructor() {
    this.connect();
  }

  private connect() {
    console.log('initializing ws connection to binance');
    this._ws = new WebSocket(process.env.BINANCE_WSAPI_CONNSTR);

    this._ws.on('open', () => {
      const data = JSON.stringify({
        method: 'SUBSCRIBE',
        params: ['ethusdt@trade', 'etheur@trade'],
        id: 1,
      });
      this._ws.send(data);
    });

    this._ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.s === 'ETHUSDT' && data.p)
        this.ETHUSDT = data.p
      if (data.s === 'ETHEUR' &&  data.p)
        this.ETHEUR = data.p
    });

    this._ws.on('close', () => {
      this.connect();
    });
  }

  private send(data: any) {
    this._ws.send(data);
  }

  private restartConnection() {
    console.debug('restarting connection');
    this._ws.reconnect();
  }

  public getCurrency() {
    let data;
    this._ws.on('message', (message) => {
      data = JSON.parse(message);
    });
    return data;
  }

  get ETHUSDT() {
    return this._ETHUSDT;
  }

  private set ETHUSDT(value) {
    this._ETHUSDT = value;
  }

  get ETHEUR() {
    return this._ETHEUR;
  }

  private set ETHEUR(value) {
    this._ETHEUR = value;
  }
}
