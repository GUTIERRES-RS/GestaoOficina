import React from 'react';
import { WifiOff, RefreshCw, ServerOff, TriangleAlert } from 'lucide-react';
import { useConnection } from '../context/ConnectionContext';

const ApiErrorScreen = () => {
    const { checking, checkConnection } = useConnection();

    return (
        <div className="connection-error-overlay">
            <div className="connection-error-card">
                <div className="status-indicator">
                    <div className="icon-wrapper">
                        <ServerOff size={40} />
                        <div className="wifi-badge">
                            <WifiOff size={16} />
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <h1>API Offline</h1>
                    <p>
                        Não foi possível estabelecer uma conexão estável com o servidor. 
                        Verifique se o backend está ativo ou se há instabilidade na rede.
                    </p>
                </div>

                <div className="action-section">
                    <button 
                        onClick={checkConnection} 
                        disabled={checking}
                        className={checking ? 'checking' : ''}
                    >
                        <RefreshCw size={18} className={checking ? 'animate-spin' : ''} />
                        {checking ? 'Restabelecendo...' : 'Tentar Reconectar'}
                    </button>
                    
                    <div className="footer-warning">
                        <TriangleAlert size={14} />
                        <span>Acessibilidade Restrita</span>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .connection-error-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #020617;
                    padding: 24px;
                }

                .connection-error-card {
                    width: 100%;
                    max-width: 400px;
                    background-color: #0f172a;
                    border: 1px solid rgba(234, 179, 8, 0.2);
                    border-radius: 24px;
                    padding: 48px 32px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(234, 179, 8, 0.05);
                    animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .status-indicator {
                    margin-bottom: 32px;
                }

                .icon-wrapper {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    background-color: rgba(234, 179, 8, 0.1);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #eab308;
                    border: 1px solid rgba(234, 179, 8, 0.2);
                }

                .wifi-badge {
                    position: absolute;
                    bottom: -6px;
                    right: -6px;
                    width: 32px;
                    height: 32px;
                    background-color: #020617;
                    border: 1px solid rgba(234, 179, 8, 0.3);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #eab308;
                }

                .content-section {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .content-section h1 {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    letter-spacing: -0.02em;
                }

                .content-section p {
                    color: #94a3b8;
                    font-size: 15px;
                    line-height: 1.6;
                    max-width: 280px;
                    margin: 0 auto;
                }

                .action-section {
                    width: 100%;
                }

                .action-section button {
                    width: 100%;
                    padding: 16px;
                    background-color: #eab308;
                    color: #451a03;
                    border: none;
                    border-radius: 14px;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 10px 15px -3px rgba(234, 179, 8, 0.3);
                }

                .action-section button:hover:not(:disabled) {
                    background-color: #facc15;
                    transform: translateY(-2px);
                }

                .action-section button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .action-section button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .footer-warning {
                    margin-top: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default ApiErrorScreen;
