import {PlanType, PrismaClient} from '@prisma/client';
const prisma = new PrismaClient();

async function createPlans(){
    const plansTest = [
        {
            id: "price_1PPy42LjSoSCii8PbgaKQJ5h",
            productType: PlanType.PRO,
            type: PlanType.MONTHLY,
            price: 1499
        },
        {
            id: "price_1PQSZBLjSoSCii8PUB1AOhU6",
            productType: PlanType.PRO,
            type: PlanType.YEARLY,
            price: 14390.4
        },
        {
            id: "price_1PPy3bLjSoSCii8P5ADtIKlk",
            productType: PlanType.STANDARD,
            type: PlanType.MONTHLY,
            price: 699
        },
        {
            id: "price_1PQSbrLjSoSCii8PfOXdeJx6",
            productType: PlanType.STANDARD,
            type: PlanType.YEARLY,
            price: 6710.4
        },
    ]

    for (let plan of plansTest){
        await prisma.plan.upsert({
            where:{
                planId: plan.id
            },
            update:{},
            create:{
                id: plan.id,
                productType: plan.productType,
                type: plan.type,
                status: "ACTIVE",
                planId: plan.id,
                amount: plan.price
            }
        })
    }
}

createPlans()
    .then(()=>{
        console.log("Success")
    })
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })