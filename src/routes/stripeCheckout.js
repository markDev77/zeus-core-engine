const express = require("express")
const router = express.Router()
const Stripe = require("stripe")

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

router.post("/stripe/create-checkout", async (req,res)=>{

 const {plan,store} = req.body

 const session = await stripe.checkout.sessions.create({

  payment_method_types:["card"],

  mode:"subscription",

  line_items:[
   {
    price:plan,
    quantity:1
   }
  ],

  success_url:"https://zeusinfra.io/success",
  cancel_url:"https://zeusinfra.io/cancel",

  metadata:{
   store:store
  }

 })

 res.json({url:session.url})

})

module.exports = router
