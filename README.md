# bull-otel-context-propagation

This repo demonstrate how to propagate OpenTelemetry context from producer (`queue.add`) to consumer (`queue.process`). It requires adding few lines of code to inject the active context to the job before adding it to queue, and then extracting the context and wrapping the process logic with the propagated context.

## Install

```
yarn install
```

## Run

To run the demo application, you need to set environment variable `ASPECTO_AUTH` to [your aspecto token](https://app.aspecto.io/7fe312f8/integration/tokens) and execute `yarn start` or `npm run start`. Example:
```
ASPECTO_AUTH=00000000-0000-0000-0000-000000000000 yarn start
```

This will start an http server on port 4000. Then invoke it with `http://localhost:4000` and observe the trace in [`trace search`](https://app.aspecto.io/search) page on Aspecto App.

## Usage
For OpenTelemetry propagation to work accross bulljs, you need to modify job opts before adding it to the queue:

This
```js
queue.add(data);
```

Turns into this
```js
import { context, propagation } from '@opentelemetry/api';

const otelSerializedContext = {};
propagation.inject(context.active(), otelSerializedContext);
queue.add(data, otelSerializedContext);
```

Also when you process the message, you need to wrap your process logic with:

This
```js
queue.process(async (job: Job<any>) => {
    // process the job
});
```

Turns into this
```js
import { context, propagation } from '@opentelemetry/api';

queue.process(async (job: Job<any>) => {
    const propagatedContext = propagation.extract(context.active(), job.opts);
    await context.with(propagatedContext, async () => {
        // process the job
    })
});
```