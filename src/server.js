// This test secret API key is a placeholder. Don't include personal details in requests with this key.
// To see your test secret API key embedded in code samples, sign in to your Stripe account.
// You can also find your test secret API key at https://dashboard.stripe.com/test/apikeys.
const express = require('express');
const app = express();

const cors = require('cors');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_KEY);
const productType = ['template', 'credits']

const YOUR_DOMAIN = 'http://localhost:4242';

app.use(express.json());
app.use(express.static('public'));
//console.log(process.env.FRONTEND_URL)


app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`📩 Requête reçue : ${req.method} ${req.url}`);
  next();
});

app.get('/', async (req, res) => {
  res.status(200).json({ message: `connecté au service de paiement` })
});


app.post('/create-checkout-session', async (req, res) => {

  try {
    //console.log('Reçu:', req.body);

    const { priceId } = req.body;
    console.log(priceId);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, price_1234) of the product you want to sell
          price: priceId, //req.body.product.price
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pricing/stripe/success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing/stripe/cancel`,
    });

    res.status(200).json({ url: session.url })
  } catch(err) {
    console.error('Erreur de session Stripe :', err);
    res.status(500).json({ message: 'Erreur lors de la création de la session Stripe' });
  }
});

app.listen(process.env.PORT, () => console.log(`Serveur écoute sur le port : http://localhost:${process.env.PORT}`));