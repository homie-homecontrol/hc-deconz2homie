
import { Settings } from './Settings';
import { Subject } from 'rxjs';
import { DeconzAPI } from '../deconz';
export class Core {


    settings: Settings;

    onShutdown$ = new Subject<boolean>();
  
    constructor() {
        this.settings = new Settings();

    }

    public async bootstrap() {
    }

    public async shutdown() {
        this.onShutdown$.next(true);
    }

}
