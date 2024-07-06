import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void => {
        console.log()
        if (req.originalUrl.startsWith('/api/v1/payment/webhook')) {
            next();
        } else {
            express.json({limit: '10mb'})(req, res, next);
        }
    }
);

app.use('/api/v1', routes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
