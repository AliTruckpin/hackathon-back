import Stripe from "stripe";
import express, {Request, Response} from "express";
import {prisma} from "../lib/prisma";
import {getCustomerProfileByCustomerId, upsertSubscription} from "../lib/paymentHelper";


const STRIPE_API_KEY = process.env.STRIPE_API_KEY
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

const stripe = new Stripe(STRIPE_API_KEY, {
    apiVersion: "2024-06-20",
});

export const webhook = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log("Webhook called");

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    } catch (err) {
        console.error(`⚠️ Error verifying Stripe webhook signature: ${err.message}`);
        next(err)
        return res.status(400).json({message: "Error verifying Stripe webhook signature", error: err});
    }
    if (event.type === 'payment_intent.succeeded' || event.type === 'payout.reconciliation_completed'
        || event.type === 'payment_intent.created' || event.type ==="payout.paid" || event.type ==="payout.created") {
        return res.status(200).json({message: "success"})
    }

    const userData = await getCustomerProfileByCustomerId((event.data.object as any).customer, (event.data.object as any)?.customer_details?.email)
    try {
        console.log("subscription event type: ", event.type)

        switch (event.type) {
            case 'customer.subscription.created':
                const subscription = event.data.object as any;
                await upsertSubscription(userData.id, userData.subscription.id, subscription.id, subscription.plan.id, subscription.status?.toUpperCase(), undefined, undefined, subscription.customer)
                break;
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const updatedSubscription = event.data.object as any;
                let status = updatedSubscription.status?.toUpperCase()
                if (updatedSubscription.cancel_at_period_end) {
                    status = 'CANCELED'
                }
                await upsertSubscription(userData.id,userData.subscription.id, updatedSubscription.id, updatedSubscription.plan.id, status,
                    new Date(updatedSubscription.current_period_end * 1000),
                    new Date(updatedSubscription.current_period_start * 1000), updatedSubscription.customer as string,)
                break;
            case 'invoice.payment_failed':
                await prisma.subscription.update({
                    where: {id: userData.subscription.id},
                    data: {
                        status: 'FAILED',
                    }
                });
                break;
            case 'invoice.payment_succeeded':
                const invoice = event.data.object as any;
                const lastDataIndex = invoice.lines.data.length - 1

                await upsertSubscription(userData.id,userData.subscription.id, userData.subscription.id, invoice.lines.data[lastDataIndex].plan.id, 'ACTIVE',
                    new Date(invoice.lines.data[lastDataIndex].period.start * 1000),
                    new Date(invoice.lines.data[lastDataIndex].period.end * 1000), invoice.customer as string)
                break;
            case 'charge.refunded':
                await prisma.subscription.update({
                    where: {id: userData.subscription.id},
                    data: {
                        status: 'REFUNDED',
                        currentPeriodEnd: new Date()
                    }
                });
                break
        }
        res.status(200).json({profile: userData});
    } catch (e) {
        console.log("Error on Stripe webhook: ", e)
        return res.status(500).json({message: "International server error", error: e})
    }
}



export const getPlans = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const plans = await prisma.plan.findMany({
            where: {
                status: "ACTIVE"
            }
        })

        return res.status(200).json({plans})
    } catch (e) {
        console.log("Error on getting plans: ", e.message)
        next(e)
        res.status(500).json({message: "Internation server error."})
    }
}



export const getPublicSessionUrl = async (req: Request, res: Response) => {
    try {
        const quantity = parseInt(req.query.quantity as string) || 1;
        const priceId = req.query.priceId as string;
        const plan = await prisma.plan.findUnique({
            where: {
                planId: priceId
            }
        })
        if (!plan) {
            return res.status(400).json({message: "Invalid price id entered"})
        }
        const paymentSuccessUrl =  process.env.UNAUTHORIZED_PAYMENT_SUCCESS;
        const paymentMode = plan.type === "ONETIME" ? "payment" : "subscription"
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: quantity
            }],
            mode: paymentMode,
            allow_promotion_codes: true,
            metadata: {
                planId: plan.planId,
            },
            success_url: `${paymentSuccessUrl}`,
            cancel_url: process.env.STRIPE_SESSION_SUCCESS_URL,
        });
        return res.status(200).json({sessionUrl: session.url});
    } catch (e) {
        console.log("Error on PUBLIC getting session url: ", e.message);
        res.status(500).json({message: "Internal server error."});
    }
};