//Create an injectable SessionService that can be used to manage session items 
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  constructor() {}

  setItem(key: string, value: any) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  getItem(key: string) {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  removeItem(key: string) {
    sessionStorage.removeItem(key);
  }

  clear() {
    sessionStorage.clear();
  }
}