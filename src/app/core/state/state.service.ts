import { Injectable } from '@angular/core';

import { ReplaySubject, Observable } from 'rxjs';


export interface InternalStateType {
  [key: string]: any;
}

interface InternalStateCache {
  [key: string]: ReplaySubject<any>
  
}

@Injectable()
export class StateService {
  private _state: InternalStateType = { };

  private _observerPairs: InternalStateCache = {};

  constructor() { }

  /** return a clone of the current state */
  get state() {
    return this._state = this._clone(this._state);
  }

  /** never allow mutation */
  set state(value: any) {
    throw new Error('do not mutate the `.state` directly');
  }

  get(prop?: any) {
    // use our state getter for the clone
    const state = this.state;

    return state.hasOwnProperty(prop) ? state[prop] : undefined;
  }

  set(prop: string, value: any) {
    const updated = this._state[prop] !== value;
    const state = this._state[prop] = value; // internally mutate our state

    if (updated && this._getSubject(prop) && value) {
      this._getSubject(prop).next(value);
    }

    return state;
  }

  observe(prop: string, subkey?: string) {
    let observable: Observable<any> = this._getSubject(prop);
    if (subkey) {
      // TODO: maybe check if subkey exists?
      // e.g observe('getblockchaininfo', 'blocks') will return only the 'blocks' key from the output.
      observable = observable.map(key => key[subkey]);
    }
    return observable.distinctUntilChanged();
  }


  private _clone(object: InternalStateType) {
    // simple object clone
    return JSON.parse(JSON.stringify(object));
  }

  private _getSubject(prop: string): ReplaySubject<any>  {
    if (!this._observerPairs[prop]) {
      this._observerPairs[prop] = new ReplaySubject<any>(1);
    }

    return this._observerPairs[prop];
  }

}
