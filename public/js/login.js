import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
    // axios will throw in error whenever is there an error
    // console.log(email, password);
    try {
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data: {
                email,
                password,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully!');
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }

        console.log(res);
    } catch (err) {
        showAlert('error', 'Incorrect email or password');
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout',
        });
        if (res.data.status === 'success') location.reload(true);
    } catch (err) {
        showAlert('Error to logout please try again!');
    }
};
