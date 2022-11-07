import { Core } from './core/Core';
import * as winston from "winston";
import { OnDestroy, OnInit } from 'node-homie/misc';
import { Subject, takeUntil } from 'rxjs';
import { store } from './state';
import { setupSettingsSideEffects } from './app/settings';
import { setupAuthenticationSideEffects } from './app/deconzAuthentication';
// import { setupResourceUpdateSideEffects } from './app/ressourceUpdates';






export class App implements OnInit, OnDestroy {
  protected onDestroy$ = new Subject<boolean>();

  protected readonly log: winston.Logger;

  private core: Core;
  // private ccu: CCU;
  // private if: Controller;

  constructor() {
    this.log = winston.child({
      type: this.constructor.name,
    });


    this.core = new Core();
    // this.ccu = new CCU(this.core);
    // this.if = new Controller(this.core);
  }


  async onInit() {
    try {
      // this.log.info('Bootstrapping core ...');
      // // await this.core.bootstrap();


      // this.log.info('... done! [Bootstrapping core]');

      // console.log("string: ", isObject('test'));

      setupAuthenticationSideEffects(this.onDestroy$);
      setupSettingsSideEffects();
      // setupResourceUpdateSideEffects(this.onDestroy$);

      // await this.ccu.init();

      // const sideEffects$ = this.authenticationSideEffects();
      // sideEffects$.pipe(takeUntil(this.onDestroy$)).subscribe();

      // await this.if.onInit();
      store.select(state => state).pipe(takeUntil(this.onDestroy$)).subscribe(
        {
          next: state => {
            this.log.info('State: ', {state});
          }
      })

      setTimeout(()=>store.initState(), 5000);

      // store.initState();



      // start sideffects
    } catch (error) {
      this.log.error('Error starting service!', error);
      process.exit(1);
    }
  }


  public async onDestroy() {
    try {
      this.onDestroy$.next(true);
      // await this.if.onDestroy();
      await this.core.shutdown();
      store.stopState();

      // await this.ccu.unsubscribeAll();
    } catch (err) {
      this.log.error('Error stopping application: ', err);
    }
  }


}


export default App;
