/**
 * Servicio de autenticación
 * Maneja login, logout y gestión de sesión de usuarios
 * @module services/authService
 */

import { storageService } from './storageService.js';
import { logger } from '../utils/errorHandler.js';

// Usuarios del sistema (en producción, esto vendría de una base de datos)
const USERS = [
    {
        id: 1,
        username: 'usuario',
        password: 'usuario123', // En producción: hash con bcrypt
        role: 'general',
        nombre: 'Usuario General'
    },
    {
        id: 2,
        username: 'director',
        password: 'director123', // En producción: hash con bcrypt
        role: 'director',
        nombre: 'Director'
    }
];

/**
 * Servicio de autenticación
 */
class AuthService {
    constructor() {
        this.sessionKey = 'user_session';
    }

    /**
     * Iniciar sesión
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Object|null} Usuario autenticado o null si las credenciales son inválidas
     */
    login(username, password) {
        try {
            // Buscar usuario
            const user = USERS.find(
                u => u.username === username && u.password === password
            );

            if (!user) {
                logger.warn('Login failed: invalid credentials', { username });
                return null;
            }

            // Crear sesión (sin incluir la contraseña)
            const session = {
                id: user.id,
                username: user.username,
                role: user.role,
                nombre: user.nombre,
                loginTime: new Date().toISOString()
            };

            // Guardar sesión
            storageService.set(this.sessionKey, session);
            logger.info('User logged in', { username: user.username, role: user.role });

            return session;
        } catch (error) {
            logger.error('Login error', error);
            return null;
        }
    }

    /**
     * Cerrar sesión
     */
    logout() {
        try {
            const session = this.getCurrentUser();
            storageService.remove(this.sessionKey);

            if (session) {
                logger.info('User logged out', { username: session.username });
            }
        } catch (error) {
            logger.error('Logout error', error);
        }
    }

    /**
     * Obtener usuario actual
     * @returns {Object|null} Usuario actual o null si no hay sesión
     */
    getCurrentUser() {
        try {
            return storageService.get(this.sessionKey, null);
        } catch (error) {
            logger.error('Error getting current user', error);
            return null;
        }
    }

    /**
     * Verificar si hay una sesión activa
     * @returns {boolean} true si hay sesión activa
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Verificar si el usuario actual tiene un rol específico
     * @param {string} role - Rol a verificar
     * @returns {boolean} true si el usuario tiene el rol
     */
    hasRole(role) {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    /**
     * Verificar si el usuario actual es director
     * @returns {boolean} true si es director
     */
    isDirector() {
        return this.hasRole('director');
    }
}

// Exportar instancia única (singleton)
export const authService = new AuthService();

// Exportar clase para testing
export default AuthService;
