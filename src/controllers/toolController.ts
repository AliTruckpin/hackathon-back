import {prisma} from "../lib/prisma";
import { Request, Response } from 'express';
import {getSessionUrl} from "../lib/paymentHelper";

export const addTool = async (req: Request, res: Response) => {

    const { url, email, title, description, planId, categoryIds } = req.body;
    try {
        if (!planId){
            return res.status(400).json({ error: 'planId is required' });

        }
        const plan = await prisma.plan.findUnique({
            where: {
                planId: planId
            }
        })
        if (!plan) {
            return res.status(400).json({ error: 'Invalid planId' });
        }
        const tool = await prisma.tool.create({
            data: {
                url,
                email,
                title,
                description,
                category:{
                    connect: categoryIds?.map((id: number) => (id )),
                }
            },
        });
        delete tool.status;
        const stripeSession = await getSessionUrl(planId, tool);
        return res.status(201).json(stripeSession.url);
    } catch (error) {
        console.log("Error on creating tool.", error.message)
        return res.status(500).json({ error: 'Something went wrong' });
    }
}


export const updateTool = async (req: Request, res: Response) => {
    const { url, email, title, description, planId, categoryIds, id, imageUrl } = req.body;
    try {
        const toolData = await prisma.tool.findUnique({
            where: {
                id: id
            }
        });

        if (!toolData) {
            return res.status(404).json({ error: 'Tool not found' });
        }
        const tool = await prisma.tool.update({
            where: {
                id: id
            },
            data: {
                url: url ?? toolData.url,
                email: email ?? toolData.email,
                title: title ?? toolData.title,
                description: description ?? toolData.description,
                imageUrl: imageUrl ?? toolData.imageUrl,
                category: {
                    set: categoryIds?.map((id: number) => ({id})),
                }
            },
        });
        return res.status(201).json(tool);
    } catch (error) {
        console.log("Error on updating tool.", error.message)
        return res.status(500).json({ error: 'Something went wrong' });
    }

}
export const getTools = async (req: Request, res: Response) => {
    try{
        const tools = await prisma.tool.findMany();
        res.status(200).json(tools);
    }catch (error) {
        console.log("Error on getting tools.", error.message)
        res.status(500).json({ error: 'Something went wrong' });
    }
}
export const getToolById = async (req: Request, res: Response) => {
    try{
        const { tool } = req.query;
        const tools = await prisma.tool.findUnique({
            where: {
                id: tool as string
            }
        });
        if (!tools){
            res.status(404).json({ error: 'Tool not found' });
        }
        res.status(200).json(tools);
    }catch (error) {
        console.log("Error on getting tools.", error.message)
        res.status(500).json({ error: 'Something went wrong' });
    }
}

export const getToolsByCategories = async (req: Request, res: Response): Promise<void> => {
    const { categoryIds } = req.query;

    if (!categoryIds || !Array.isArray(categoryIds)) {
        res.status(400).json({ error: 'categoryIds query parameter is required and should be an array' });
        return;
    }
    try {
        const tools = await prisma.tool.findMany({
            where: {
                categoryId: {
                    in: categoryIds,
                },
            },
            include: {
                category: true,
            },
        });

        if (!tools.length) {
            res.status(404).json({ message: 'No tools found for these categories' });
        } else {
            res.status(200).json(tools);
        }
    } catch (error) {
        console.log("Error on getting tools by categories.",error.message)
        res.status(500).json({ error: 'Something went wrong' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany();
        res.status(200).json(categories);
    }catch (error) {
        console.log("Error on getting categories.", error.message)
        res.status(500).json({ error: 'Something went wrong' });
    }
}