interface Subscription {
  unsubscribe: () => void
}

export default function subscribe(el: Element): Subscription;
