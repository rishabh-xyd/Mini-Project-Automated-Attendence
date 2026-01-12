import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Configure axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const login = async (email, password) => {
        try {
            // Form data for OAuth2
            // Form data for OAuth2 (x-www-form-urlencoded)
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await axios.post('http://localhost:8000/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const accessToken = res.data.access_token;

            if (!accessToken) {
                console.error("Login successful but no access_token received!");
                return false;
            }

            localStorage.setItem('token', accessToken);
            setToken(accessToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Fetch user details
            const userFetched = await fetchUser();
            return userFetched;
        } catch (error) {
            console.error("Login failed (Catch Block). Details:", error.response ? error.response.data : error.message);
            return false;
        }
    };

    const register = async (name, email, password, role) => {
        // This is now an admin-only function
        try {
            await axios.post('http://localhost:8000/admin/users', { name, email, password, role });
            return true;
        } catch (error) {
            console.error("User creation failed", error);
            throw error;
        }
    };

    const fetchUser = async () => {
        try {
            const res = await axios.get('http://localhost:8000/users/me');
            setUser(res.data);
            return res.data; // Return full user object
        } catch (error) {
            console.error("Fetch user failed (details):", error.response ? error.response.data : error.message);
            logout();
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
        navigate('/'); // Redirect to Home/Kiosk
    };

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
