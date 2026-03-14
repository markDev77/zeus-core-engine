const fetch = require("node-fetch")

const USADROP_API = process.env.USADROP_API_URL
const USADROP_KEY = process.env.USADROP_API_KEY

async function fetchProducts(page = 1, limit = 20) {

    try {

        /*
        ============================================
        DEVELOPMENT MODE
        Si no hay API configurada usamos mock
        ============================================
        */

        if (!USADROP_API) {

            console.log("USADROP MOCK MODE")

            return [

                {
                    title: "Wireless Bluetooth Earbuds",
                    description: "High quality earbuds for iPhone and Android"
                },

                {
                    title: "LED Desk Lamp",
                    description: "Modern lighting lamp for home office"
                },

                {
                    title: "Dog Training Collar",
                    description: "Pet training collar with remote control"
                }

            ]

        }

        /*
        ============================================
        REAL API CALL
        ============================================
        */

        const response = await fetch(`${USADROP_API}/products?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${USADROP_KEY}`
            }
        })

        const data = await response.json()

        if (!data || !data.products) {
            return []
        }

        return data.products

    } catch (err) {

        console.error("USADROP API ERROR:", err)

        return []
    }

}

module.exports = {
    fetchProducts
}