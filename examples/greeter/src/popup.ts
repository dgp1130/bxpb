import { GreeterClient } from '../proto/foo/bar/greeter_bxclients';
import { GreetRequest } from '../proto/foo/bar/greeter_pb';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) throw new Error('Could not find form element.');

    form.addEventListener('submit', async (evt) => {
        evt.preventDefault();

        const nameInput = document.querySelector('#name') as HTMLInputElement|null;
        if (!nameInput) throw new Error('Could not find name input element.');
        const name = nameInput.value;

        // Make an example request to the `Greeter` service.
        const client = new GreeterClient(chrome.runtime.sendMessage);
        const req = new GreetRequest();
        req.setName(name);
        const res = await client.Greet(req);
        
        const output = document.querySelector('#output') as HTMLDivElement|null;
        if (!output) throw new Error('Could not find output element.');
        output.textContent = res.getMessage();
    });
});