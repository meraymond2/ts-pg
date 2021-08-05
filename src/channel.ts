export class Channel<T> {
  items: T[]
  onPush: null | ((x: T) => void)

  constructor() {
    this.items = []
  }

  push(x: T): void {
    this.items.push(x)
    if (this.onPush) this.onPush(x)
  }
}
