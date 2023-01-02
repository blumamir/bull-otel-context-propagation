import instrument, { trace } from '@aspecto/opentelemetry';
instrument();

import { context, propagation } from '@opentelemetry/api';
import Queue, { Job } from 'bull';
import express from 'express';
import axios from 'axios';

const app = express();

const videoQueue = new Queue('video transcoding', 'redis://127.0.0.1:6379');

videoQueue.process(async (job: Job<any>) => {
    const propagatedContext = propagation.extract(context.active(), job.opts);
    await context.with(propagatedContext, async () => {
        // simulate some work
        const res = await axios.get('http://aspecto.io')
    })
});

app.use((_req, res) => {
    const otelSerializedContext = {};
    propagation.inject(context.active(), otelSerializedContext);
    // use otelSerializedContext as the otps. if you already have opts, merge them
    videoQueue.add({ video: 'http://example.com/video1.mov' }, otelSerializedContext);
    res.json({ message: 'ok' });
});

app.listen(4000, () => console.log('server started on port 4000'));

