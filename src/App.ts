import { Core } from './core/Core';
import { Controller } from './Controller';

import * as winston from "winston";
import { OnDestroy, OnInit } from 'node-homie5/misc';


export class App implements OnInit, OnDestroy {
  protected readonly log: winston.Logger;

  private core: Core;
  // private ccu: CCU;
  private if: Controller;

  constructor() {
    this.log = winston.child({
      type: this.constructor.name,
    });

    
    this.core = new Core();
    // this.ccu = new CCU(this.core);
    this.if = new Controller(this.core);
  }


  public async onDestroy() {
    try {
      await this.if.onDestroy();
      await this.core.shutdown();
      // await this.ccu.unsubscribeAll();
    } catch (err) {
      this.log.error('Error stopping application: ', err);
    }
  }

  async onInit() {
    try {
      this.log.info('Bootstrapping core ...');
      await this.core.bootstrap();
      this.log.info('... done! [Bootstrapping core]');

      // await this.ccu.init();

      await this.if.onInit();

    } catch (error) {
      this.log.error('Error starting service!', error);
      process.exit(1);
    }
  }
}

export default App;
