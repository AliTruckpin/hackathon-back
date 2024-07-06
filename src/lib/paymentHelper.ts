import Stripe from "stripe";
import {prisma} from "./prisma";

const STRIPE_API_KEY = process.env.STRIPE_API_KEY
const stripe = new Stripe(STRIPE_API_KEY, {
    apiVersion: "2024-06-20",
});

export const upsertSubscription = async (userId,id, subsId, planId, status,currentPeriodEnd,currentPeriodStart, stripeCustomerId) =>{
    console.log("Upsert subscription function called.")
    const updateData:any = {
        status,
        plans:{
            connect:{
                id:planId
            }
        },
    }
    console.log("planId", planId)
    if (currentPeriodEnd){
        updateData.currentPeriodEnd = currentPeriodEnd
        updateData.currentPeriodStart=currentPeriodStart
    }
    await prisma.subscription.upsert({
        where: {
            id
        },
        update: updateData,
        create: {
            subscriptionId: subsId,
            userId:userId,
            status,
            plans:{
                connect:{
                    id:planId
                }
            },
            currentPeriodEnd,
            currentPeriodStart,
            stripeCustomerId: stripeCustomerId,
        },
    })
}

export const getCustomer = async (customerId: string) => {
    try{
        const customer: any = await stripe.customers.retrieve(customerId);
        return customer
    }
    catch (e) {
        console.log("Error on get customer: ", e.message)
        return null
    }
}

export const getCustomerProfileByCustomerId = async (customerId: string, email) => {
    if (!customerId && !email) {
        return
    }
    let userStripeData = await getCustomer(customerId);
    if (!userStripeData) {
        const stripeCustomerId = await getStripeCustomerId(email);
        userStripeData = await getCustomer(stripeCustomerId);
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (user) {
            await prisma.user.update({
                where: {
                    email: email
                },
                data: {
                    stripeCustomerId: stripeCustomerId
                }
            })
        }
    }
    let userData: any = await prisma.user.findFirst({
        where: {
            stripeCustomerId: userStripeData.id
        },
        include: {
            subscription: {
                include: {
                    plans: true
                }
            },
            trello: true
        }
    })
    if (!userData) {
        userData = await prisma.user.create({
            data: {
                email: userStripeData.email,
                stripeCustomerId: customerId,
                subscription: {
                    create: {
                        stripeCustomerId: customerId,
                        status: "INCOMPLETE",
                    }
                },
            },
            include: {subscription: {include: {plans: true}}},
        })
    }
    if (!userData.subscription) {
        userData.subscription = await prisma.subscription.create({
            data: {
                userId: userData.id,
                stripeCustomerId: customerId,
                status: "INCOMPLETE",
            }
        })
    }
    return userData
}
export const getStripeCustomerId = async (email:string) => {
    try {
        const existingCustomers = await stripe.customers.list({email: email, limit: 1});

        if (existingCustomers.data.length > 0) {
            console.log("Exist customer", existingCustomers.data[0].id)
            return existingCustomers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({email: email});
            return newCustomer.id;
        }
    } catch (e) {
        console.log("Error on create customer: ", e.message)
    }
}


export const getSessionUrl = async (priceId: string, tool:any) => {

    const paymentSuccessUrl =  `${process.env.STRIPE_SESSION_SUCCESS_URL}?tool=${tool.id}`;
    return await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price: priceId,
            quantity: 1
        }],
        mode: "subscription",
        allow_promotion_codes: true,
        metadata: tool,
        success_url: `${paymentSuccessUrl}`,
        cancel_url: process.env.STRIPE_SESSION_SUCCESS_URL,
    })
}