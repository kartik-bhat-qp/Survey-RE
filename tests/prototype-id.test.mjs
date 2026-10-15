import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrototypeId} from '../src/lib/prototype-id.mjs';

test('stack IDs work on an HTTP preview where randomUUID is unavailable',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const getRandomValues=globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues}});
  try {
    const ids=Array.from({length:100},()=>createPrototypeId());
    assert.equal(new Set(ids).size,100);
    assert.ok(ids.every(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
  }finally {Object.defineProperty(globalThis,'crypto',original);}
});
