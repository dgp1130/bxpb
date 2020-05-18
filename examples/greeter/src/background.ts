import { GreetRequest } from '../proto/foo/bar/greeter_pb';

const req = new GreetRequest();
req.setName('Dave');

// Just say hello for now.
console.log(`Hello ${req.getName()}!`);