/**
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

export class AsyncTee {
  constructor(iterable) {
    this.it = iterable[Symbol.asyncIterator]();
    this.values = [];
    this.finished = false;
  }

  async *[Symbol.asyncIterator]() {
    let i = 0;
    while (i < this.values.length || !this.finished) {
      if (i < this.values.length) {
        yield this.values[i++];
      } else {
        let { value, done } = await this.it.next();
        if (done) this.finished = true;
        else this.values.push(value);
      }
    }
  }
}

export class Tee {
  constructor(iterable) {
    this.it = iterable[Symbol.iterator]();
    this.values = [];
    this.finished = false;
  }

  *[Symbol.iterator]() {
    let i = 0;
    while (i < this.values.length || !this.finished) {
      if (i < this.values.length) {
        yield this.values[i++];
      } else {
        let { value, done } = this.it.next();
        if (done) this.finished = true;
        else this.values.push(value);
      }
    }
  }
}
