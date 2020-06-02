import { FakeEvent } from './fake_event';

describe('FakeEvent', () => {
    it('triggers events on listeners', () => {
        const listener = jasmine.createSpy('listener');

        const evt = new FakeEvent<(evt: string) => void>();
        evt.addListener(listener);
        evt.trigger('test');
        expect(listener).toHaveBeenCalledWith('test');
        evt.removeListener(listener);
        evt.trigger('test2');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).not.toHaveBeenCalledWith('test2');
    });

    it('triggers events on multiple listeners', () => {
        const listener1 = jasmine.createSpy('listener1');
        const listener2 = jasmine.createSpy('listener2');

        const evt = new FakeEvent<(evt: string) => void>();
        evt.addListener(listener1);
        evt.addListener(listener2);
        evt.trigger('test');

        expect(listener1).toHaveBeenCalledWith('test');
        expect(listener2).toHaveBeenCalledWith('test');
        
        evt.removeListener(listener1);
        evt.trigger('test2');
        
        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).not.toHaveBeenCalledWith('test2');
        expect(listener2).toHaveBeenCalledTimes(2);
        expect(listener2).toHaveBeenCalledWith('test2');

        evt.removeListener(listener2);
        evt.trigger('test3');

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener1).not.toHaveBeenCalledWith('test3');
        expect(listener2).toHaveBeenCalledTimes(2);
        expect(listener2).not.toHaveBeenCalledWith('test3');
    });

    describe('hasListener()', () => {
        it('returns `true` when the given listener is listening', () => {
            const listener = jasmine.createSpy('listener');
            const evt = new FakeEvent<(evt: string) => void>();
            evt.addListener(listener);
            expect(evt.hasListener(listener)).toBe(true);
        });

        it('returns `false` when the given listener is **not** listening', () => {
            const listener = jasmine.createSpy('listener');
            const evt = new FakeEvent<(evt: string) => void>();
            // Did not call `evt.addListener(listener)`.
            expect(evt.hasListener(listener)).toBe(false);
        });
    });

    describe('hasListeners()', () => {
        it('returns `true` when the event has listeners', () => {
            const evt = new FakeEvent<(evt: string) => void>();
            evt.addListener(jasmine.createSpy('listener'));
            expect(evt.hasListeners()).toBe(true);
        });

        it('returns `false` when the event does not have listeners', () => {
            const evt = new FakeEvent<(evt: string) => void>();
            expect(evt.hasListeners()).toBe(false);
        });
    });
});