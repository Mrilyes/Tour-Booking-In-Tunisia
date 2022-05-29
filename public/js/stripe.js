import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
    'pk_test_51Kz3zNCFnI74RUkzT3zWlh49PB6X6eM7TnEz5l2M2naAa7z28FhQoVwRnazPchS0O10G4s5n56VZd234ZFbg5GH000o2mqIjqB'
);

export const bookTour = async (tourId) => {
    try {
        // 1. Get checkout session from the API
        const session = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        // console.log(session);

        // 2. Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};
