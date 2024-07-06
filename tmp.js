const axios = require('axios');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Kategoriyalar ro'yxati
const categories = [
    { icon: "🎙️", value: "Podcasting" },
    { icon: "💼", value: "Jobs" },
    { icon: "🔓", value: "Open source" },
    { icon: "📝", value: "Form builders" },
    { icon: "🏠", value: "Remote work" },
    { icon: "📰", value: "News" },
    { icon: "🔌", value: "Browser extensions" },
    { icon: "☁️", value: "Cloud computing" },
    { icon: "🖥️", value: "CMS" },
    { icon: "💵", value: "Accounting" },
    { icon: "🔒", value: "Privacy" },
    { icon: "☁️", value: "Cloud infrastructure" },
    { icon: "📝", value: "To do lists" },
    { icon: "🏡", value: "Interior design" },
    { icon: "💵", value: "Fintech" },
    { icon: "🔍", value: "Scrapers" },
    { icon: "📓", value: "Journaling" },
    { icon: "🔍", value: "Search" },
    { icon: "💳", value: "Payments" },
    { icon: "📋", value: "Job boards" },
    { icon: "🌐", value: "Language learning" },
    { icon: "🌐", value: "Translation" },
    { icon: "📈", value: "Performance monitoring" },
    { icon: "🔒", value: "Security" },
    { icon: "💵", value: "Fundraising" },
    { icon: "📅", value: "Online scheduling" },
    { icon: "🧠", value: "Mental health" },
    { icon: "📰", value: "Journalism" },
    { icon: "🔍", value: "Recruiting" },
    { icon: "💵", value: "Reduce costs" },
    { icon: "👼", value: "Angel investing" },
    { icon: "🎥", value: "Motion design" },
    { icon: "📸", value: "Image recognition" },
    { icon: "👥", value: "Communities" },
    { icon: "👪", value: "Parenting" },
    { icon: "📁", value: "File sharing" },
    { icon: "🎵", value: "Music" },
    { icon: "💬", value: "Messaging" },
    { icon: "🖼️", value: "Stable diffusion" },
    { icon: "💵", value: "Venture capital" },
    { icon: "🏋️", value: "Fitness" },
    { icon: "💾", value: "Storage" }
];

const fetchTools = async () => {
    try {
        // Kategoriyalarni database-ga yozish
        // for (const category of categories) {
        //     await prisma.category.upsert({
        //         where: { id:"testing" },
        //         update: {},
        //         create: {name: category.value },
        //     });
        // }

        const response = await axios.get('https://1000.tools/');
        const html = response.data;
        const $ = cheerio.load(html);
        const tools = [];

        $('.tool-item').each((index, element) => {
            const title = $(element).find('.tool-title').text();
            const description = $(element).find('.tool-description').text();
            const url = $(element).find('.tool-link').attr('href');
            const imageUrl = $(element).find('.tool-image').attr('src');
            const categoryValue = $(element).find('.tool-category').text().trim();

            console.log({ title, description, url, imageUrl, categoryValue }); // Elementlarni ko'rish uchun qo'shildi

            tools.push({
                title,
                description,
                url,
                imageUrl,
                categoryValue,
                email: 'default@example.com',
            });
        });
        console.log(tools)
        for (const tool of tools) {
            const category = await prisma.category.findUnique({
                where: { name: tool.categoryValue },
            });

            if (category) {
                await prisma.tool.create({
                    data: {
                        url: tool.url,
                        email: tool.email,
                        title: tool.title,
                        description: tool.description,
                        imageUrl: tool.imageUrl,
                        categoryId: category.id,
                    },
                });
            }
        }

        console.log('Tools have been added to the database.');
    } catch (error) {
        console.error('Error fetching tools:', error);
    } finally {
        await prisma.$disconnect();
    }
};

fetchTools();
