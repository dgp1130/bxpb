/**
 * Fake implementation of a {@link chrome.events.Event<T>}. Also includes a `trigger()` function to
 * manually invoke an event with the given data.
 */
export class FakeEvent<Listener extends (...args: any[]) => void>
        implements chrome.events.Event<Listener> {
    private listeners: Listener[] = [];

    /** Trigger all listeners with the given data. */
    trigger(...data: Parameters<Listener>) {
        for (const listener of this.listeners) {
            listener(...data);
        }
    }

    addListener(listener: Listener) {
        this.listeners = this.listeners.concat([listener]);
    }

    removeListener(listener: Listener) {
        const newListeners = this.listeners.filter((l) => l !== listener);

        // If no listeners were removed, then the input must not have been previously added as a
        // listener. Fail the test to better ensure accuracy.
        if (newListeners.length === this.listeners.length) {
            fail('Removed listener which was not previously added.');
        }
        this.listeners = newListeners;
    }

    hasListener(listener: Listener): boolean {
        return this.listeners.includes(listener);
    }

    hasListeners(): boolean {
        return this.listeners.length !== 0;
    }

    addRules() {
        fail('addRules() not implemented.');
    }

    removeRules() {
        fail('removeRules() not implemented.');
    }

    getRules() {
        fail('getRules() not implemented.');
    }
}