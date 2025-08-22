

const express = require('express');
const app = express();

const cors = require('cors');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_KEY);
const productType = ['template', 'credits']

const YOUR_DOMAIN = 'http://localhost:4242';

const authenticateToken = require('./auth.middleware');

//app.use(express.json());
//app.use(express.static('public'));
//console.log(process.env.FRONTEND_URL)


app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`📩 Requête reçue : ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next(); // pas de express.json ici
  } else {
    express.json()(req, res, next);
  }
});

app.get('/', async (req, res) => {
  res.status(200).json({ message: `connecté au service de paiement` })
});


app.post('/create-checkout-session', authenticateToken, async (req, res) => {

  try {
    // extraction du token pour le trasnmettre en meta-data coté webhook
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const { priceId, productName, userId } = req.body;
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
      metadata: {
        userId: userId,
        productName: productName,
        userToken: token
      }
    });

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Erreur de session Stripe :', err);
    res.status(500).json({ message: 'Erreur lors de la création de la session Stripe' });
  }
});


// route qui sera appelé un fois l'achat complété
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Événement de paiement réussi
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log("el toki = " + session.metadata.userToken)
    const customerEmail = session.customer_email;

    try {
      // Appelle le DatabaseService pour ajouter les crédits
      await fetch(`${process.env.DATABASE_SERVICE_URL}/users/buyCredits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.metadata.userToken}`
        },
        body: JSON.stringify({ userId : session.metadata.userId, productName: session.metadata.productName })
      });
      console.log(`Crédit ajouté pour ${customerEmail}`);
    } catch (err) {
      console.error("Erreur lors de l'actualisation du nombre de crédits :" + err.message);
    }

    try {
      // Appelle le DatabaseService pour ajouter les crédits
      await fetch(`${process.env.NOTIFICAITON_SERVICE_URL}/email/bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.metadata.userToken}`
        },
        body: JSON.stringify({ userId : session.metadata.userId, productName: session.metadata.productName })
      });
      console.log(`Crédit ajouté pour ${customerEmail}`);
    } catch (err) {
      console.error("Erreur lors de l'actualisation du nombre de crédits :" + err.message);
    }

  }



  res.status(200).json({ received: true });
});

app.listen(process.env.PORT, () => console.log(`Serveur écoute sur le port : http://localhost:${process.env.PORT}`));