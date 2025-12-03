// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import '../Login.css';

export function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lockoutUntil, setLockoutUntil] = useState(() => {
        const saved = localStorage.getItem('login_lockout_until');
        return saved ? parseInt(saved, 10) : null;
    });
    const [failedAttempts, setFailedAttempts] = useState(() => {
        const saved = localStorage.getItem('login_failed_attempts');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [currentTime, setCurrentTime] = useState(Date.now());

    // Update current time every second to drive the countdown
    useEffect(() => {
        if (!lockoutUntil) return;

        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, [lockoutUntil]);

    // Check lockout expiration based on current time
    const isLocked = lockoutUntil && currentTime < lockoutUntil;

    const getRemainingTime = () => {
        if (!lockoutUntil) return 0;
        return Math.max(0, Math.ceil((lockoutUntil - currentTime) / 1000));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isLocked) {
            const remaining = getRemainingTime();
            setError(`Sistema bloqueado por seguridad. Intente nuevamente en ${remaining} segundos.`);
            return;
        }

        setLoading(true);

        // Validación básica
        if (!username.trim() || !password.trim()) {
            setError('Por favor, ingrese usuario y contraseña');
            setLoading(false);
            return;
        }

        // Intentar login
        const success = onLogin(username, password);

        if (success) {
            // Reset on success
            setFailedAttempts(0);
            setLockoutUntil(null);
            localStorage.removeItem('login_failed_attempts');
            localStorage.removeItem('login_lockout_until');
        } else {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            localStorage.setItem('login_failed_attempts', newAttempts.toString());

            if (newAttempts >= 5) {
                // Exponential backoff: 30s, 60s, 120s, etc.
                // Base 30s * 2^(attempts - 5)
                const backoffSeconds = 30 * Math.pow(2, newAttempts - 5);
                const lockoutTime = Date.now() + (backoffSeconds * 1000);

                setLockoutUntil(lockoutTime);
                localStorage.setItem('login_lockout_until', lockoutTime.toString());

                setError(`Demasiados intentos fallidos. Sistema bloqueado por ${backoffSeconds} segundos.`);
            } else {
                setError(`Credenciales inválidas. Intento ${newAttempts}/5.`);
            }
            setPassword('');
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-background"></div>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">CA</div>
                    <h1 className="login-title">Corporativa AcmeTrans</h1>
                    <p className="login-subtitle">Sistema de Gestión de Transporte</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Ingrese su usuario"
                            autoComplete="username"
                            autoFocus
                            disabled={loading || isLocked}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingrese su contraseña"
                            autoComplete="current-password"
                            disabled={loading || isLocked}
                        />
                    </div>

                    {error && (
                        <div className="login-error" style={{
                            backgroundColor: isLocked ? '#fee2e2' : '#fff1f2',
                            color: isLocked ? '#991b1b' : '#be123c',
                            border: isLocked ? '1px solid #f87171' : '1px solid #fda4af'
                        }}>
                            {isLocked ? '🔒' : '⚠️'} {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading || isLocked}
                        style={{
                            opacity: (loading || isLocked) ? 0.7 : 1,
                            cursor: (loading || isLocked) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLocked
                            ? `Bloqueado (${getRemainingTime()}s)`
                            : (loading ? 'Iniciando sesión...' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="login-hint">
                        💡 <strong>Demo:</strong> usuario/usuario123 o director/director123
                    </p>
                </div>
            </div>
        </div>
    );
}
